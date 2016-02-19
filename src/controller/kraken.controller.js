const ipcRenderer = require('electron').ipcRenderer;

var Kraken = require('kraken'),
	fs = require('fs'),
	path = require('path'),
	mime = require('mime'),
	https = require('https'),
	remote = require('remote'),
	Menu = remote.require('menu');

var count = 0,
		kraken,
		appData = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
		appData = (process.platform == 'win32') ? appData + "/AppData/Local/Krakening" : appData + "/Library/Application\ Support/Krakening"

console.log(home);

var template = [
  {
    label: 'Krakening',
    submenu: [
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        selector: 'terminate:'
      },
    ]
  },
	{
		label: 'Edit',
		submenu: [
			{
        label: 'Cut',
        accelerator: 'Command+X',
        selector: 'cut:'
      },
      {
        label: 'Copy',
        accelerator: 'Command+C',
        selector: 'copy:'
      },
      {
        label: 'Paste',
        accelerator: 'Command+V',
        selector: 'paste:'
      }
		]
	},
	{
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'Command+R',
        click: function() { remote.getCurrentWindow().reload(); }
      },
      {
        label: 'Toggle DevTools',
        accelerator: 'Alt+Command+I',
        click: function() { remote.getCurrentWindow().toggleDevTools(); }
      },
    ]
  }
];

menu = Menu.buildFromTemplate(template);

Menu.setApplicationMenu(menu);


var count = 0,
		kraken,
		home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

		var enterKey = function(){
			kraken = { api_key: document.getElementById('userKey').value,
								 api_secret: document.getElementById('userSecret').value};
		 if(kraken.api_key === '' || kraken.api_secret ==='' ){
				document.getElementsByClassName('holder__content').text = "Please restart app and enter key";
				return;
			} else {
				fs.writeFile(appData + '/Simsim', JSON.stringify(kraken), 'utf8', (err, data) => {
					if(err) console.log(err);
					setup();
				});
			}
		};

var verifyKey = function () {
	fs.access( home + '/Library/Application\ Support/Krakening/Simsim', [fs.F_OK], function(err) {
		if(err){
			console.log('No Key');
			document.getElementById('auth_overlay').style.display = 'flex';
		} else {
			fs.readFile(home + '/Library/Application\ Support/Krakening/Simsim', 'utf8', (err, data) => {
				if(err){return console.log(err);}

				var key = {};
				JSON.parse(data, function(k, v){
					key[k] = v;
				});
				kraken = {api_key: key.api_key, api_secret: key.api_secret};
				setup();
			});
		}
	});
}

		///////////////////
		// Progress Bar
		///////////////////

var progressBar = function (length){
	count++;
	if(count % 2 == 0){
		var realcount = count/2;
		console.log('File ' + realcount + ' of ' + length);
	}
	var bar = document.getElementById('progress__bar');
	var filesComplete = (count / (length*2)) * 100;
	bar.style.width = filesComplete + '%';

	if(bar.style.width === '100%') {
		setTimeout(function(){
			bar.style.width = '0%';
		}, 1500)
	}
};

		///////////////////
		// Compression
		///////////////////

var krakenize = function (file, length) {

	var opts = {	file: fs.createReadStream(file.path),
		wait: true
		//dev: true
	};

	var filename = path.format({
		root: file.naming.root,
		dir: file.naming.dir,
		base: file.naming.base
	});

	kraken.upload(opts, function(data){
		if (data.success){
			progressBar(length);
			console.log('Success. Optimized image URL: %s', data.kraked_url);
			var krakedFile = fs.createWriteStream(filename);
			var request = https.get(data.kraked_url, function (res) {
				res.pipe(krakedFile);
				progressBar(length);
			});
			return data;
		} else {
			console.log('Fail. Error Message: %s', data.message);
		}
	});
};

		///////////////////
		// Drop Event
		///////////////////

var filesDropped = function (e) {
	count = 0;
	e.preventDefault();
	var fileDrop = e.dataTransfer.files,
			workingFiles = [],
			fileArray = [];

	//console.log(fileDrop);

	for (files in fileDrop){
		workingFiles.push(fileDrop[files]);
	}

	function pushFile (idx) {
		fileArray.push(fileDrop[idx]);
	}
	var counter = 0;
	var idx = 0;

	while ( idx < workingFiles.length){
		counter++;

		if(typeof workingFiles[idx] != "object") {
			workingFiles.splice(idx, 1);
			continue;
		}
		var fileStats = fs.statSync(workingFiles[idx].path);
		var isDirectory = fileStats.isDirectory();

		//console.log(workingFiles);

		if(isDirectory){
			var directoryPath = workingFiles[idx].path + '/';

			var fsFilesSync = fs.readdirSync(directoryPath);

			for (num in fsFilesSync){
				fileStats = fs.statSync(directoryPath + fsFilesSync[num]);
				isDirectory = fileStats.isDirectory();

				var pushIDX = workingFiles.length;

				if(isDirectory){
					workingFiles.push({
						path: directoryPath + fsFilesSync[num],
						name: fsFilesSync[num],
						naming: path.parse(workingFiles[idx].path),
						type: mime.lookup(directoryPath + fsFilesSync[num])
					});
				} else {
					if( mime.lookup(directoryPath + fsFilesSync[num]) === 'image/png' ||
							mime.lookup(directoryPath + fsFilesSync[num]) === 'image/jpeg' ||
						  mime.lookup(directoryPath + fsFilesSync[num]) === 'image/gif') {
								workingFiles.push({
									path: directoryPath + fsFilesSync[num],
									name: fsFilesSync[num],
									naming: path.parse(workingFiles[idx].path),
									type: mime.lookup(directoryPath + fsFilesSync[num])
								});
							}
				}
			}
			workingFiles.splice(idx, 1);
		} else {
			if( workingFiles[idx].type === 'image/png' ||
					workingFiles[idx].type === 'image/jpeg' ||
					workingFiles[idx].type === 'image/gif') {
					workingFiles[idx].naming = path.parse(workingFiles[idx].path);
					fileArray.push(workingFiles[idx]);
					idx++;
			} else {
				workingFiles.splice(idx, 1);
				continue;
			}
		}
	}
	for (file in fileArray){
		krakenize(fileArray[file], fileArray.length, file);
	}
};

		///////////////////
		// Setup
		///////////////////

var init = function(){
	kraken = verifyKey();
};

var setup = function(){

	kraken = new Kraken(kraken);
	document.getElementById('auth_overlay').style.display = 'none';
	var topbar = document.getElementById('header');
	var holder = document.getElementById('holder');
	var closeButton = document.getElementById('window__close');

	holder.ondrag = function (e) { return false; };
	holder.ondragover = function (e) { return false; };
	holder.ondragleave = holder.ondragend = function (e) { return false; };
	holder.ondrop = function (e) { filesDropped(e);	};

	topbar.ondrag = function (e) { return false; };
	topbar.ondragover = function (e) { return false; };
	topbar.ondrop = function (e) { return false; };


	closeButton.onclick = function (e) {
		ipcRenderer.send('close-window', 'close');

		ipcRenderer.on('close-window', function(event, arg) {
  		console.log(arg); // prints "pong"
		});
	}

		return false;
};
