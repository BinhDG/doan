const FireAlert = require('../model/FireAlert');
const moment = require('moment');
const configTime = require('../time');
const { Op } = require('sequelize');

module.exports.getFireAlerts = async (req, res) => {
    try {
        const { page, level, keyword, sortKey, sortValue, frequent } = req.query;
        let limit = frequent ? parseInt(frequent) : 10;
        let where = {};
        let order = [];

        if (sortKey && sortValue) {
            order.push([sortKey, parseInt(sortValue) === 1 ? 'ASC' : 'DESC']);
        } else {
            order.push(['createdAt', 'DESC']);
        }

        if (level) {
            where.level = level;
        }

        if (keyword) {
            const timeRange = configTime(keyword);
            if (timeRange) {
                where.createdAt = { [Op.between]: [timeRange.start, timeRange.end] };
            } else {
                where.reason = { [Op.like]: `%${keyword}%` };
            }
        }

        const skipPage = page ? (parseInt(page) - 1) * limit : 0;

        const { count, rows } = await FireAlert.findAndCountAll({
            where: where,
            offset: skipPage,
            limit: limit,
            order: order,
            raw: true
        });

        let alerts = rows.map(item => {
            item.createdAt = moment(item.createdAt).format('HH:mm:ss DD/MM/YYYY');
            return item;
        });

        res.status(200).json({
            doc: alerts,
            totalPage: Math.ceil(count / limit) || 1,
            currentPage: page ? parseInt(page) : 1
        });
    } catch (error) {
        console.error("Lỗi lấy lịch sử cảnh báo:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};