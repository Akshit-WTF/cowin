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

(() => {
    unirest('GET', 'https://raw.githubusercontent.com/Akshit-WTF/cowin/main/package.json')
        .end(function (res) {
            res.body = JSON.parse(res.body);
            if (res.body.version !== packageJSON.version) {
                unirest('GET', 'https://raw.githubusercontent.com/Akshit-WTF/cowin/main/toUpdate.json')
                    .end(function (res) {
                        let files = (JSON.parse(res.body)).files;
                        for (const i of files) {
                            unirest('GET', `https://raw.githubusercontent.com/Akshit-WTF/cowin/main/${i}`)
                                .end(function (res) {
                                    fs.writeFileSync(path.join(__dirname, `./${i}`), res.raw_body);
                                    if (files.indexOf(i) === files.length - 1) {
                                        console.log(chalk.redBright(`A NEW VERSION OF THE SCRIPT IS NOW AVAILABLE. It has been updated. Run it again.`));
                                        process.exit(0);
                                    }
                                });
                        }
                    });
            }
        });
})();

if (config.autotoken === true) {
    const io = require("socket.io-client");
    const socket = io.connect('https://sms.axit.me/' + config.phone);
    socket.on('otp', async function(data) {
        let str = data.message;
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
    });
}

if (config.autotoken === false) {
    const puppeteer = require('puppeteer');
    (async () => {
        let execPath;
        if (fs.existsSync('C:/Program Files (x86)/Google/Chrome/Application/chrome.exe')) {
            execPath = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
        }
        if (fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) {
            execPath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
        }
        if (!execPath) {
            console.log(chalk.redBright('To use the manual OTP option, you need Google Chrome installed on your PC.'));
            process.exit();
        }
        const browser = await puppeteer.launch({headless: false, executablePath: execPath});
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
        unirest('POST', 'https://svg2jpg.akshit.me')
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
                isAuthorized = false;
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