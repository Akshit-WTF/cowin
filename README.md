
# COWIN - Brute Force

This is a simple yet powerful script to book an appointment for the COVID-19 vaccine on the COWIN website by utilizing the power of powerful computing. I wrote this script after understanding the level of corruption in obtaining an appointment on the COWIN platform.

## Basic Requirements

In order to use this script, you will need the following:

- **Node.JS** (Version 14.17.0) [Official Website](https://nodejs.org/en/download)
- **Anti-Captcha API Key** [Official Website](https://anti-captcha.com)
  You can get almost 70 free captcha solves as demo credits after you sign up and verify your phone number.
- **COWIN Account** [Official Website](https://selfregistration.cowin.gov.in)
- **Beneficiary ID**

## Token Obtaining Methods

The COWIN portal operates with API authorization tokens. These are obtained by OTP validation and are valid for 15 minutes. I have created two methods to obtain a token:

### Automatic Method:

In order to use this method you will be needed to fulfil the following requirements:

- **Tasker Application**
- **Android Device** - With the number used on the COWIN portal
- **Computer and Phone on the same network**

Begin with obtaining the computer's IP address. This can be done by following the steps below:

- Click on the Wi-Fi/Ethernet Logo on the bottom right of your computer screen, then click on `Open Network & Internet Settings`.  
  ![How to obtain IP Step - 1](https://cdn.akshit.me/file/Screenshot_40.png?v=1621021187866)

- Click on the `Properties` tab.  
  ![How to obtain IP Step - 2](https://cdn.akshit.me/file/Screenshot_41.png?v=1621021193510)

- Scroll down to the bottom, and you'll find the `IPv4 address` column.  
  ![How to obtain IP Step - 3](https://cdn.akshit.me/file/Screenshot_42.png?v=1621021198755)

Next, you will set up the Tasker Application on your Android Device.

```yaml  
IMPORTANT NOTE: Tasker is a paid application. I would love it if you buy the application to support the developer. However, if you can not afford to spend money for this process you can download the trial version from the link below.  
```  

[Tasker Trial Version](https://tasker.joaoapps.com/releases/playstore/Tasker.12.21.apk)

After installing Tasker, follow these steps:

- Click on add task button (+)<br />  
  <img src="https://cdn.akshit.me/file/Screenshot_20210515-012406_Tasker.jpg?v=1621026211742" width="200"/>

- When the menu pops open, click on `Event`<br />  
  <img src="https://cdn.akshit.me/file/Screenshot_20210515-012414_Tasker.jpg?v=1621026211784" width="200"/>

- Select `Phone` in the event category<br />  
  <img src="https://cdn.akshit.me/file/Screenshot_20210515-012423_Tasker.jpg?v=1621026211824" width="200"/>

- Select `Received Text`<br />  
  <img src="https://cdn.akshit.me/file/Screenshot_20210515-012429_Tasker.jpg?v=1621026211812" width="200"/>

- Return to the previous screen<br />  
  <img src="https://cdn.akshit.me/file/Screenshot_20210515-012440_Tasker.jpg?v=1621026211796" width="200"/>

- Click on `New Task`<br />  
  <img src="https://cdn.akshit.me/file/Screenshot_20210515-012448_Tasker.jpg?v=1621026211912" width="200"/>

- Click on add action button (+)<br />  
  <img src="https://cdn.akshit.me/file/Screenshot_20210515-012458_Tasker.jpg?v=1621026211635" width="200"/>

- Select the `Net` option<br />  
  <img src="https://cdn.akshit.me/file/Screenshot_20210515-012505_Tasker.jpg?v=1621026211721" width="200"/>

- Select the `HTTP Request` option<br />  
  <img src="https://cdn.akshit.me/file/Screenshot_20210515-012513_Tasker.jpg?v=1621026212990" width="200"/>

- Change the method to `POST`<br />  
  <img src="https://cdn.akshit.me/file/Screenshot_20210515-012521_Tasker.jpg?v=1621026211850" width="200"/>

- Fill in the URL and body field as instructed below:<br />In the URL field put the `http://<IP.OF.COMPUTER>/sms` while replacing `<IP.OF.COMPUTER>` with the IP we copied earlier.<br />In the body field paste the following as it is:

 ```json  
 {"body":"%SMSRB"}  
```  

<img src="https://cdn.akshit.me/file/Screenshot_20210515-012634_Tasker.jpg?v=1621026211950" width="200"/>  

- Return to the main page and click on the checkmark.<br /><img src="https://cdn.akshit.me/file/Screenshot_20210515-012644_Tasker.jpg?v=1621026211821" width="200"/>

- Open config.json on your computer and change `autotoken` to `true`.

### Manual Method:

This method is not recommended, but you may use it if you do not wish to follow all the steps in automatic mode.

- Change `autotoken` to `false` in config.json on your computer.
- Login to the COWIN portal in the browser window that opens on your computer once you run the script.

## Understanding CONFIG.JSON

This is the file that contains all the configuration data required for the script to function.

```json
{  
  "anti-captcha-key": "CAN BE OBTAINED FROM ANTI-CAPTCHA.COM AND APPLY FOR DEMO CREDITS.",  
  "phone": "PHONE NUMBER REGISTERED WITH ON COWIN",  
  "beneficiary": "BENEFICIARY ID",  
  "pincode": "PIN_CODE",  
  "18": true, // put true if you are seeking 18-44 registrations and false if you are seeking 45+ registrations
  "autotoken": false  // put true if you want to use the Automatic method of token fetching or false if you wish to use the manual method.
}
```

## How to run?

In order to run the script, please fill the CONFIG.JSON file appropriately.

After that, Shift + Right click inside the folder that contains the index.js file.

Select `Open Powershell` or `Open CMD`.

If you are running the script for the first time, run `npm install`.

Then run, `node index`.