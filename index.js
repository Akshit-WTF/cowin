const config = require('./config.json');
const crypto = require('crypto');
const unirest = require('unirest');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ac = require("@antiadmin/anticaptchaofficial");
const moment = require('moment');
const packageJSON = require('./package.json');
let PupPage;

if (config.ngrok) {
    (async function() {
        try {
            const ngrok = require('ngrok');
            const url = await ngrok.connect({
                proto: 'http',
                addr: 80,
                authtoken: config.ngrok,
                region: 'in'
            });
            console.log(chalk.yellowBright(`Set the URL in your SMS Forwarding application to ${url}.`));
        } catch (e) {
            console.log(chalk.redBright(`There was an error encountered while connecting to NGROK. Please cross-check your authToken.`));
            console.log(chalk.redBright(`If you are not using NGROK. Change the value of ngrok to false in config.json.`));
        }
    })();
}

(() => {
    unirest('GET', 'https://raw.githubusercontent.com/Akshit-WTF/cowin/main/package.json')
        .end(function (res) {
            res.body = JSON.parse(res.body);
            if (res.body.version !== packageJSON.version) {
                unirest('GET', 'https://raw.githubusercontent.com/Akshit-WTF/cowin/main/toUpdate.json')
                    .end(function (res) {
                       for (const i of (JSON.parse(res.body)).files) {
                           unirest('GET', `https://raw.githubusercontent.com/Akshit-WTF/cowin/main/${i}`)
                               .end(function (res) {
                                    fs.writeFileSync(path.join(__dirname, `./${i}`), res.raw_body);
                               });
                       }
                    });
                console.log(chalk.redBright(`A NEW VERSION OF THE SCRIPT IS NOW AVAILABLE. It has been updated. Run it again.`));
                process.exit(0);
            }
        });
})();

if (config.autotoken === true) {
    const app = require('express')();
    app.use(require('body-parser').json());
    app.post('/', async function (req, res) {
        let str = req.body.message;
        if (str.toLowerCase().includes('cowin')) {
            for (const i of str.split(' ')) {
                let maybeOTP = i.slice(0, -1);
                if (maybeOTP.length === 6 && !isNaN(parseInt(maybeOTP))) {
                    token = `Bearer ${await getAuthToken(otpUUID, maybeOTP)}`;
                    console.log(chalk.greenBright(`${moment().format('LTS')}: Regenerated the authorization token successfully.`));
                    checkAlive();
                }
            }
        }
        res.sendStatus(200);
    });
    app.listen(80);
}

if (config.autotoken === false) {
    const puppeteer = require('puppeteer');
    (async () => {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.goto('https://selfregistration.cowin.gov.in');
        page.on('response', async (response) => {
            const request = response.request();
            if (request.url().includes('validateMobileOtp') && request.method() === "POST") {
                const body = await response.json();
                if (body.token) {
                    token = `Bearer ${body.token}`;
                    console.log(chalk.greenBright(`${moment().format('LTS')}: Regenerated the authorization token successfully.`));
                    checkAlive();
                }
            }
        });
        PupPage = page;
    })();
}

if (config.beneficiaries.length === 0 || !config.phone || !config["anti-captcha-key"] || (config.dose !== 1 && config.dose !== 2)) {
    console.log(chalk.redBright('Variable(s) missing/incorrect in the config file. Please fix to continue.'));
    process.exit(0);
}

ac.setAPIKey(config["anti-captcha-key"]);
ac.shutUp();

let otpUUID = '';
let token = '';
let captchaRequested = false;
let isAuthorized = false;

function replace(original, toReplace, replacement) {
    return original.replace(new RegExp(toReplace, "gi"), replacement);
}

function requestOTP() {
    unirest('POST', 'https://cdn-api.co-vin.in/api/v2/auth/generateMobileOTP')
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify({
            "mobile": config.phone,
            "secret": "U2FsdGVkX1+9pRYVTYpP7nNgkOD7vbxwd74VM9D5OYctbNlcUq9frLeFXrIRFTHlorr+d98h5aaZ33/8O91uxw=="
        }))
        .end(function (res) {
            otpUUID = res.body.txnId;
        });
}

(() => {
    if (fs.existsSync(path.join(__dirname, './token'))) {
        token = fs.readFileSync(path.join(__dirname, './token'), 'utf-8');
    }
    checkAlive();
})()

function getAuthToken(id, otp) {
    return new Promise(function (resolve) {
        unirest('POST', 'https://cdn-api.co-vin.in/api/v2/auth/validateMobileOtp')
            .headers({
                'Content-Type': 'application/json'
            })
            .send(JSON.stringify({
                "otp": crypto.createHash('sha256').update(otp).digest('hex'),
                "txnId": id
            }))
            .end(function (res) {
                resolve(res.body.token);
            });
    });
}

function convertSVGtoPNG(svg) {
    return new Promise(function (resolve) {
        unirest('POST', 'http://svg2jpg.akshit.me')
            .headers({
                'Content-Type': 'application/json'
            })
            .send(JSON.stringify({
                "svg": svg
            }))
            .end(function (res) {
                resolve(res.body.jpeg);
            });
    })
}

function getCaptcha() {
    if (captchaRequested === true) return false;
    return new Promise(function (resolve, reject) {
        unirest('POST', 'https://cdn-api.co-vin.in/api/v2/auth/getRecaptcha')
            .headers({
                'Authorization': token
            })
            .end(async function (res) {
                captchaRequested = true;
                let svg = res.body.captcha;
                svg = svg.replace(/\\\//g, "/");
                for (let i = 111; i < 999; i += 111) {
                    svg = replace(svg, `fill="#${i}"`, 'fill="#fff"')
                    svg = replace(svg, `stroke="#${i}"`, 'stroke="none"')
                }
                let base64 = await convertSVGtoPNG(svg);
                let captcha = await ac.solveImage(base64);
                resolve(captcha);
            });
    });
}

let sessionCheckInterval = setInterval(function () {
    checkAlive();
}, 30000);

function checkAlive() {
    unirest('GET', 'https://cdn-api.co-vin.in/api/v2/appointment/beneficiaries')
        .headers({
            'Authorization': token
        })
        .end(function (res) {
            if (res.status !== 401) {
                isAuthorized = true;
                console.log(chalk.greenBright(`${moment().format('LTS')}: Session status confirmed to be alive.`));
                fs.writeFileSync(path.join(__dirname, './token'), token);
            } else {
                if (config.autotoken === false) {
                    if (!PupPage) return;
                    PupPage.reload();
                }
                if (config.autotoken === true) {
                    requestOTP();
                }
                console.log(chalk.redBright(`${moment().format('LTS')}: Session has expired.`));
            }
        });
}

let mainInterval = setInterval(function () {
    if (!isAuthorized) return console.log(chalk.redBright(`${moment().format('LTS')}: Session not authorized, not checking for available slots.`));
    console.log(chalk.blueBright(`${moment().format('LTS')}: Checking for available slots on the COWIN portal.`));
    unirest('GET', 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin?pincode=' + config.pincode + '&date=' + moment().format('DD-MM-YYYY'))
        .headers({
            'Authorization': token
        })
        .end(async function (res) {
            try {
                let foundSlot = false;
                for (const centre of res.body.centers) {
                    for (const session of centre.sessions) {
                        if ((session.min_age_limit === 18) === config["18"] && session[`available_capacity_dose${config.dose}`] !== 0) {
                            foundSlot = true;
                            let captcha = await getCaptcha();
                            if (captcha === false) return;
                            unirest('POST', 'https://cdn-api.co-vin.in/api/v2/appointment/schedule')
                                .headers({
                                    'Authorization': token,
                                    'Content-Type': 'application/json'
                                })
                                .send(JSON.stringify({
                                    "center_id": centre.center_id,
                                    "session_id": session.session_id,
                                    "captcha": captcha,
                                    "beneficiaries": config.beneficiaries,
                                    "slot": session.slots[0],
                                    "dose": config.dose
                                }))
                                .end(function (res) {
                                    if (res.body.appointment_confirmation_no) {
                                        console.log(chalk.greenBright('Appointment booked successfully! Please login to check.'));
                                        clearInterval(mainInterval);
                                        clearInterval(sessionCheckInterval);
                                        process.exit(0);
                                    } else {
                                        captchaRequested = false;
                                        foundSlot = false;
                                        console.log(chalk.redBright('Tried booking an appointment but failed. Restart this script.'));
                                        console.log(chalk.redBright('Reason: ' + res.body.error));
                                    }
                                });
                        }
                    }
                }
                if (foundSlot === false) {
                    console.log(chalk.redBright('No slots are available right now. Will keep checking.'));
                }
            } catch (e) {
                console.log(chalk.redBright('We might be getting rate limited.'));
            }
        });
}, 1750);