const Model = require('../model/model');

class controller {
    constructor() { }

    addNew(obj) {
        return new Promise((resolve, reject) => {
            let newItem = new Model(obj);
            newItem.save((err, saved) => {
                if (err) {
                    reject(err);
                }
                resolve(newItem);
            });
        });
    }

    getAll() {
        return new Promise((resolve, reject) => {
            Model.find((err, all) => {
                if (err) {
                    reject(err)
                }
                resolve(all);
            })
        });
    }

    getOne(id) {
        return new Promise((resolve, reject) => {
            Model.findById(id, (err, single) => {
                if (err) {
                    reject(err)
                }
                resolve(single);
            })
        });
    }

    getById(telegramId) {
        return new Promise((resolve, reject) => {
            Model.findOne({ telegramId }, (err, single) => {
                if (err) {
                    reject(err)
                }
                resolve(single);
            })
        });
    }

    deleteById(address) {
        return new Promise((resolve, reject) => {
            Model.findOneAndDelete({ address }, (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve('  Deleted Successfully');
            });
        });
    }




    delete(id) {
        return new Promise((resolve, reject) => {
            Model.findByIdAndDelete(id, (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve('  Deleted Successfully');
            });
        });
    }


}

module.exports = new controller();