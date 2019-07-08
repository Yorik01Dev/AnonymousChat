'use strict';

const mysql = require('mysql2');
const fs = require('fs');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

let sequelize;
let config;
let User;

let readConfig = function() {
    return new Promise((resolve, reject) => {
        fs.readFile('./Database/DBconfig.json', function (err, res) {
            if (err)
                reject(err);
            else
                resolve(JSON.parse(res));
        });
    });
};

let connect = async function(){
    config = await readConfig();
    sequelize = new Sequelize(config.dbName, config.user, config.password, {
        dialect: config.dialect,
        host: config.host
    });
    User = require('./models/User')(sequelize);

    return sequelize.authenticate();
};

let regUser = async function (regData) {
    return await User.create({
        Name: regData.name,
        LastName: regData.lastName,
        Email: regData.email,
        Username: regData.username,
        Password: regData.password
    })
};

let checkLogin = async function(username, password){
    return new Promise((resolve, reject) => {
        User.findAll({
            where: {
                [Op.and]: [{Username: username}, {Password: password}]
            }
        })
            .then(res => {
                if(Object.keys(res).length !== 0)
                    resolve(200);
                else
                    reject({status: 401, message: 'incorrect username or password'});

            })
            .catch(err => reject({status: 500, message: err}));
    });
};

let getUserByID = async function(id){
    return await User.findAll({
        where: {
            ID: id
        }
    }).catch(err => console.warn(err));
};

module.exports = {connect, regUser, checkLogin, getUserByID};