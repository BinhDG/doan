const dataController = require("./controller/dataSensor");
const fireAlertController = require("./controller/fireAlertController");

module.exports = (app) => {
    app.get("/api/getDataSensor", dataController.getData);
    app.get("/api/getFireAlerts", fireAlertController.getFireAlerts);
};