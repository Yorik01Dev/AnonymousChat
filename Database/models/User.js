const Sequelize = require('sequelize');

module.exports = function (sequelize) {
    return sequelize.define('user', {
        ID: {
            type: Sequelize.BIGINT(11),
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        Name: {
            type: Sequelize.STRING(45),
            allowNull: false
        },
        LastName: {
            type: Sequelize.STRING(45),
            allowNull: false
        },
        Email: {
            type: Sequelize.STRING(45),
            allowNull: false,
            unique: true
        },
        Username: {
            type: Sequelize.STRING(45),
            allowNull: false,
            unique: true
        },
        Password: {
            type: Sequelize.STRING(45),
            allowNull: false
        }
    },
        {
            timestamps: false
        });
};