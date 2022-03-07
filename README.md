# npm-tapo-camera
Npm package to facilitate communication with TP Link Tapo cameras.

# Information

This is the first package of this kind I create and upload to Github. Please except some bugs and problems in general. Any help with maintaining the library is very welcome!! 

This library was based on PyTapo by @JurajNyiri!

# Installing

```ts
npm install npm-tapo-camera
```

or

```js
yarn add npm-tapo-camera
```

# Usage

```ts
const tapo_camera = require('npm-tapo-camera')

// Use credentials from Advanced Settings -> Camera Account
const user = 'username'
const password = 'password'

const ip = '192.168.1.1'

await tapo_camera.setup(ip, user, password)

await tapo_camera.getInfo()
.catch(error => 
  console.log(error)
)
.then(data => 
  console.log(data)
)
```

# API

## Get details from camera's status
```ts
await tapo_camera.getInfo()
.then(data => {
  console.log(data)
})
.catch(error => {
  console.log(error)
})
```

## Set camera's parameters
```ts
await tapo_camera.set(Object controls)
```
Controls:

- osd: Object
  - {
    date: {
      enabled: Boolean,
      x: Number,
      y: Number
    },
    week: {
      enabled: Boolean,
      x: Number,
      y: Number
     },
    label1: {
      enabled: Boolean,
      x: Number,
      y: Number
    }
  }
- privacyMode: Boolean
- alarm: Object 
  - {
      enabled: Boolean,
      alarm: String ['sound', 'light']
    }
- led: Boolean
- dayNightMode: String ['off', 'on', 'auto']
- motionDetection: Boolean
- autoTrackTarget: Boolean
- lensDistortionCorrection: Boolean
- imageFlipVertical: Boolean

###### Example
```ts
await tapo_camera.set({
  led: true,
  autoTrackTarget: false
})
```

## Make camera do a certain action
```ts
await tapo_camera.do(Object controls)
```
Controls:

- moveMotor: Object
  - {
    x: Number,
    y: Number
  } 
- moveMotorStep: Number
- calibrateMotor: Anything *
- format: Anything *
- reboot: Anything *
- savePreset: String ['Name of the preset']
- deletePreset: String ['Preset's id']
- setPreset: String ['Preset's id']

*For these fields the value does not matter, what matters is that the key is present in the controls' Object.

###### Example
```ts
await tapo_camera.do({
  moveMotor: {
    x: 10,
    y: -20
  }
})
```

# Disclaimer
Please keep in mind that this package is not official and I do not have any affiliation with TP-Link or Tapo.

Author does not guarantee functionality of this library and is not responsible for any damage. All product names, trademarks and registered trademarks in this repository, are property of their respective owners.
