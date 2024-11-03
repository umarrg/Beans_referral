require('./connections/connection.mongo')();
require('dotenv').config();
const express = require("express");
const TelegramBot = require('node-telegram-bot-api');
const { getById, addNew } = require('./dao/dao');
const Model = require('./model/model');
const AdminTask = require('./model/adminTask');

const adminIds = ["1140923270"];

const bot = new TelegramBot(process.env.TOKEN, { polling: true });

const app = express();
const port = process.env.PORT || 9000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

bot.setMyCommands([
    { command: '/start', description: 'Start using the bot and get your referral link' },
    { command: '/referral', description: 'Get your personal referral link' },
    { command: '/referrals', description: 'View how many people you have referred' },
    { command: '/leaderboard', description: 'View the referral leaderboard' },
    { command: '/reset_leaderboard', description: 'Reset the referral leaderboard (admin only)' },
    { command: '/createtask', description: 'Create a task with points (admin only)' },
    { command: '/tasks', description: 'View available tasks and earn points' },
    { command: '/completetask', description: 'Complete a task to earn points' },
    { command: '/points', description: 'View your total points' },
    { command: '/help', description: 'Get information about the bot and available commands' },
]);


const isAdmin = (telegramId) => adminIds.includes(telegramId.toString());

const generateReferralLink = (telegramId) => `https://t.me/BeansDegenTask_bot?start=${telegramId}`;

bot.onText(/\/start(.*)/, async (msg, match) => {
    const telegramId = msg.chat.id;
    const username = msg.from.username;
    const referredBy = match[1] ? match[1].trim() : null;

    let user = await getById(telegramId);

    if (!user) {
        const referralCode = telegramId;
        await addNew({
            username,
            telegramId,
            referralCode,
            referredBy: referredBy || null,
        });

        if (referredBy) {
            const referrer = await Model.findOne({ referralCode: referredBy });
            if (referrer) {
                referrer.referralCount += 1;
                await referrer.save();
                bot.sendMessage(referrer.telegramId, `🎉 Someone used your referral link! You now have ${referrer.referralCount} referrals!`);
            }
        }

        bot.sendMessage(telegramId, `👋 Welcome to the Referral Task Bot!\n\nYour personal referral link is: ${generateReferralLink(telegramId)}\n\nShare it with your friends to earn rewards!`);
    } else {
        bot.sendMessage(telegramId, `👋 Welcome back! Your personal referral link is: ${generateReferralLink(telegramId)}\n\nYou can always check your referral status with /referrals.`);
    }
});

bot.onText(/\/referral/, async (msg) => {
    const telegramId = msg.chat.id;
    const user = await Model.findOne({ telegramId });

    if (user) {
        const referralLink = generateReferralLink(telegramId);
        bot.sendMessage(telegramId, `🔗 Your personal referral link is: ${referralLink}\n\nShare it with your friends and get rewards!`);
    } else {
        bot.sendMessage(telegramId, `❗️You need to start using /start to get your referral link.`);
    }
});
bot.onText(/\/points/, async (msg) => {
    const telegramId = msg.chat.id;
    const user = await Model.findOne({ telegramId });

    if (user) {
        const totalPoints = user.totalPoints || 0;
        bot.sendMessage(telegramId, `🏅 You have a total of ${totalPoints} points.`);
    } else {
        bot.sendMessage(telegramId, `❗️You need to start using /start to begin earning points.`);
    }
});

bot.onText(/\/referrals/, async (msg) => {
    const telegramId = msg.chat.id;
    const user = await Model.findOne({ telegramId });

    if (user) {
        bot.sendMessage(telegramId, `📊 You have referred ${user.referralCount} users! Keep sharing your referral link: ${generateReferralLink(telegramId)}`);
    } else {
        bot.sendMessage(telegramId, `❗️You need to start using /start to track your referrals.`);
    }
});

bot.onText(/\/leaderboard/, async (msg) => {
    const users = await Model.find().sort({ referralCount: -1 }).limit(10); // Top 10 users
    let leaderboard = '🏆 Leaderboard:\n\n';
    users.forEach((user, index) => {
        leaderboard += `${index + 1}. User ${user.telegramId}: ${user.referralCount} referrals\n`;
    });
    bot.sendMessage(msg.chat.id, leaderboard);
});

bot.onText(/\/reset_leaderboard/, async (msg) => {
    const telegramId = msg.chat.id;
    if (!isAdmin(telegramId)) {
        return bot.sendMessage(telegramId, '❗️ You are not authorized to reset the leaderboard.');
    }

    try {
        await Model.updateMany({}, { $set: { referralCount: 0 } });
        bot.sendMessage(msg.chat.id, '🔄 The leaderboard has been reset successfully!');
    } catch (error) {
        bot.sendMessage(msg.chat.id, '❗️ Error resetting the leaderboard. Please try again later.');
    }
});

bot.onText(/\/createtask (.+)/, async (msg, match) => {
    const telegramId = msg.chat.id;
    // if (!isAdmin(telegramId)) {
    //     return bot.sendMessage(telegramId, '❗️ You are not authorized to create tasks.');
    // }

    const taskInput = match[1].trim().split('|');
    if (taskInput.length !== 2) {
        return bot.sendMessage(telegramId, '❗️ Invalid format. Use /createtask taskName|points');
    }

    const [taskName, points] = taskInput;
    if (!taskName || isNaN(points)) {
        return bot.sendMessage(telegramId, '❗️ Invalid task name or points. Please try again.');
    }

    try {
        const newTask = new AdminTask({ taskName, points: parseInt(points, 10) });
        await newTask.save();
        bot.sendMessage(telegramId, `✅ Task "${taskName}" with ${points} points has been created!`);
    } catch (error) {
        bot.sendMessage(telegramId, '❗️ Error creating the task. Please try again later.');
    }
});
bot.onText(/\/tasks/, async (msg) => {
    try {
        const tasks = await AdminTask.find();
        if (tasks.length === 0) {
            return bot.sendMessage(msg.chat.id, '❗️ No tasks available at the moment.');
        }

        let taskList = '📝 Available Tasks:\n\n';
        tasks.forEach((task, index) => {
            taskList += `${index + 1}. ${task.taskName} - ${task.points} points\n`;
        });

        bot.sendMessage(msg.chat.id, taskList);
    } catch (error) {
        bot.sendMessage(msg.chat.id, '❗️ Error retrieving tasks. Please try again later.');
    }
});
bot.onText(/\/completetask (.+)/, async (msg, match) => {
    const telegramId = msg.chat.id;
    const taskName = match[1].trim();
    const user = await Model.findOne({ telegramId });

    if (user) {
        const task = await AdminTask.findOne({ taskName });

        if (task) {
            user.totalPoints = (user.totalPoints || 0) + task.points;
            await user.save();
            bot.sendMessage(telegramId, `✅ You have completed the task "${taskName}" and earned ${task.points} points! Your total points are now ${user.totalPoints}.`);
        } else {
            bot.sendMessage(telegramId, `❗ Task not found. Please try again.`);
        }
    } else {
        bot.sendMessage(telegramId, `❗️You need to start using /start to begin earning points.`);
    }
});


bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, `💡 Welcome to the Referral Task Bot! Here's what you can do:\n\n/start - Register and get your referral link.\n/referral - Get your personal referral link.\n/referrals - See how many people you've referred.\n/leaderboard - View the top users.\n/reset_leaderboard (admin only) - Reset the leaderboard.\n/createtask (admin only) - Create tasks with points.\n/help - See this help message again.`);
});

app.listen(port, () => {
    console.log(`App is running on port ${port}`);
});
