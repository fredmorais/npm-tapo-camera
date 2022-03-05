# npm-tapo-camera
Npm package to facilitate communication with TP Link Tapo cameras.

# Information

This is the first package of this kind I create and upload to Github. Please except some bugs and problems in general. Any help with maintaining the library is very welcome!! 

This library was based on PyTapo by @JurajNyiri!

# Installing

```
npm install npm-tapo-camera
```

or

```
yarn add npm-tapo-camera
```

# Usage

```
const tapo_camera = require('npm-tapo-camera')

const ip = '192.168.1.1'

// Use credentials from Advanced Settings -> Camera Account
const user = username
const password = password

await tapo_camera.setup(ip, user, password)
		.catch(error => 
			console.log(error)
		)
		.then(data => 
      console.log(data)
		)
```

# API

// Get details from camera's status
tapo_camera.getInfo()

// Set camera's parameters
tapo_camera.set()

// Make camera do a certain action
tapo_camera.do()

# Disclaimer
Please keep in mind that this package is not official and I do not have any affiliation with TP-Link or Tapo.

Author does not guarantee functionality of this library and is not responsible for any damage. All product names, trademarks and registered trademarks in this repository, are property of their respective owners.
