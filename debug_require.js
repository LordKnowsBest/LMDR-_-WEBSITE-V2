
try {
    require('./src/backend/applicationService.jsw');
    console.log("Require success!");
} catch (e) {
    console.log("Require failed:");
    console.log(e);
}
