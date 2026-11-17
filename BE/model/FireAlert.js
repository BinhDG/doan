const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const FireAlert = sequelize.define('fireAlert', {
    level: {
        type: DataTypes.STRING, // 'WARNING' hoặc 'DANGER'
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false
    },
    temperature: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    humidity: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    light: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}, {
    tableName: 'fire_alerts',
    timestamps: true
});

module.exports = FireAlert;