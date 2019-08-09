'use strict'
const mysql = require('mysql');

let connection = null;

// C library API
const ffi = require('ffi');
const ref = require('ref');

// Express App (Routes)
const express = require("express");
const app = express();
const path = require("path");
const fileUpload = require('express-fileupload');

//typeDef

let Calendar = ref.types.void;
let CalendarPtr = ref.refType(Calendar);
let CalendarPtrPtr = ref.refType(CalendarPtr);

let sharedLib = ffi.Library('./libcal', {

  'createCalendar': ["int", ["string", CalendarPtrPtr]],
  'validateCalendar': ["int", [CalendarPtr]],
  'deleteCalendar': ["void", [CalendarPtr]],

  'calendarToJSON': ["string", [CalendarPtr]],
  'calendarToEventListJSON': ["string", [CalendarPtr]],

  'eventToPropList': ["string", [CalendarPtr, "int"]],
  'eventToAlarmList': ["string", [CalendarPtr, "int"]],

  'getAddedEvent': ["string", ["string", CalendarPtr, "string", "string", "string", "string", "string", "string", "int"]],
  'getAddedCal': ["string", ["string", "string", "string", "string", "string", "string", "string", "string", "string", "int"]],

});

let database = [];
let dataFiles = [];

let count = 0;
let fCount = 0;
let eCount = 0;
let aCount = 0;

app.use(fileUpload());

// Minimization
const fs = require('fs');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Important, pass in port as in `npm run dev 1234`, do not change
const portNum = process.argv[2];

// Send HTML at root, do not change
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

// Send Style, do not change
app.get('/style.css', function(req, res) {
  //Feel free to change the contents of style.css to prettify your Web app
  res.sendFile(path.join(__dirname + '/public/style.css'));
});

// Send obfuscated JS, do not change
app.get('/index.js', function(req, res) {
  fs.readFile(path.join(__dirname + '/public/index.js'), 'utf8', function(err, contents) {
    const minimizedContents = JavaScriptObfuscator.obfuscate(contents, {
      compact: true,
      controlFlowFlattening: true
    });
    res.contentType('application/javascript');
    res.send(minimizedContents._obfuscatedCode);
  });
});

app.post('/upload', function(req, res) {
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }
  let uploadFile = req.files.uploadFile;
  if (uploadFile === undefined) {
    return res.sendStatus(400);
  }
  if (fs.existsSync('uploads/' + uploadFile.name)) {
    return res.sendStatus(409);
  }
  uploadFile.mv('uploads/' + uploadFile.name, function(err) {
    if (err) {
      return res.status(500).send(err);
    }
    res.redirect('/');
  });
});

//Respond to GET requests for files in the uploads/ directory
app.get('/uploads/:name', function(req, res) {
  fs.stat('uploads/' + req.params.name, function(err, stat) {
    if (err == null) {
      res.sendFile(path.join(__dirname + '/uploads/' + req.params.name));
    } else {
      res.send('');
    }
  });
});

//******************** Your code goes here ********************

app.get('/getCalInfo', function(req, res) {
  let tempCal = ref.alloc(CalendarPtrPtr);
  if (!fs.existsSync("./uploads/" + req.query.name)) {
    return res.status(404).send('404');
  }
  let errorCode = sharedLib.createCalendar("./uploads/" + req.query.name, tempCal);
  let cal = tempCal.deref();
  let caljson;
  if (errorCode === 0) {
    errorCode = sharedLib.validateCalendar(cal);
    if (errorCode === 0) {
      caljson = sharedLib.calendarToJSON(cal);
      caljson = caljson.replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");
      caljson = caljson.replace(/[\u0000-\u0019]+/g, "");

      let add = [caljson.slice(0, caljson.length - 1), (",\"fileName\":\"" + req.query.name + "\""), caljson.slice(caljson.length - 1)].join('');
      caljson = JSON.parse(caljson);
      sharedLib.deleteCalendar(cal);
      database = database.substring(0, database.length - 1);
      if (count == 0) {
        database += '[' + add + ']';
      } else {
        database += ',' + add + ']';
      }
      count++;
      res.send(caljson);
    } else {
      sharedLib.deleteCalendar(cal);
      try {
        fs.unlinkSync("./uploads/" + req.query.name)
      } catch (err) {
        console.error(err)
      }
      return res.status(422).send('' + errorCode);
    }
  } else {
    sharedLib.deleteCalendar(cal);
    try {
      fs.unlinkSync("./uploads/" + req.query.name)
    } catch (err) {
      console.error(err)
    }
    return res.status(422).send('' + errorCode);
  }
});

app.get('/getEventProps', function(req, res) {
  let tempCal = ref.alloc(CalendarPtrPtr);
  if (!fs.existsSync("./uploads/" + req.query.name)) {
    return res.status(404).send('404');
  }
  let errorCode = sharedLib.createCalendar("./uploads/" + req.query.name, tempCal);
  let cal = tempCal.deref();
  let propListJson = sharedLib.eventToPropList(cal, req.query.index);
  propListJson = propListJson.replace(/\\n/g, "\\n")
    .replace(/\\'/g, "\\'")
    .replace(/\\"/g, '\\"')
    .replace(/\\&/g, "\\&")
    .replace(/\\r/g, "\\r")
    .replace(/\\t/g, "\\t")
    .replace(/\\b/g, "\\b")
    .replace(/\\f/g, "\\f");
  propListJson = propListJson.replace(/[\u0000-\u0019]+/g, "");
  propListJson = JSON.parse(propListJson);
  sharedLib.deleteCalendar(cal);
  res.send(propListJson);
});

app.get('/getEventAlarms', function(req, res) {
  let tempCal = ref.alloc(CalendarPtrPtr);
  if (!fs.existsSync("./uploads/" + req.query.name)) {
    return res.status(404).send('404');
  }
  let errorCode = sharedLib.createCalendar("./uploads/" + req.query.name, tempCal);
  let cal = tempCal.deref();
  let alarmListJson = sharedLib.eventToAlarmList(cal, req.query.index);
  alarmListJson = alarmListJson.replace(/\\n/g, "\\n")
    .replace(/\\'/g, "\\'")
    .replace(/\\"/g, '\\"')
    .replace(/\\&/g, "\\&")
    .replace(/\\r/g, "\\r")
    .replace(/\\t/g, "\\t")
    .replace(/\\b/g, "\\b")
    .replace(/\\f/g, "\\f");
  alarmListJson = alarmListJson.replace(/[\u0000-\u0019]+/g, "");
  alarmListJson = JSON.parse(alarmListJson);
  sharedLib.deleteCalendar(cal);
  res.send(alarmListJson);
});


app.get('/getCalEvents', function(req, res) {
  let tempCal = ref.alloc(CalendarPtrPtr);
  if (!fs.existsSync("./uploads/" + req.query.name)) {
    return res.status(404).send('404');
  }
  let errorCode = sharedLib.createCalendar("./uploads/" + req.query.name, tempCal);
  let cal = tempCal.deref();
  let eventListJson = sharedLib.calendarToEventListJSON(cal);
  eventListJson = eventListJson.replace(/\\n/g, "\\n")
    .replace(/\\'/g, "\\'")
    .replace(/\\"/g, '\\"')
    .replace(/\\&/g, "\\&")
    .replace(/\\r/g, "\\r")
    .replace(/\\t/g, "\\t")
    .replace(/\\b/g, "\\b")
    .replace(/\\f/g, "\\f");
  eventListJson = eventListJson.replace(/[\u0000-\u0019]+/g, "");
  eventListJson = JSON.parse(eventListJson);
  sharedLib.deleteCalendar(cal);
  res.send(eventListJson);
});

//Send files on server
app.get('/getFiles', function(req, res) {
  fs.readdir('./uploads', (err, files) => {
    database = "[";
    count = files.length;
    let directory = [];
    files.forEach(function(fileName) {
      let tempCal = ref.alloc(CalendarPtrPtr);
      let errorCode = sharedLib.createCalendar("./uploads/" + fileName, tempCal);
      let cal = tempCal.deref();
      //check if it passes createCalendar
      if (errorCode === 0) {
        errorCode = sharedLib.validateCalendar(cal);
        //check if it passes validateCalendar
        if (errorCode === 0) {
          directory.push(fileName);
          let caljson = sharedLib.calendarToJSON(cal);
          let add = [caljson.slice(0, caljson.length - 1), (",\"fileName\":\"" + fileName + "\""), caljson.slice(caljson.length - 1)].join('');
          database += add + ',';
        } else {
          try {
            fs.unlinkSync("./uploads/" + fileName)
          } catch (err) {
            console.error(err)
          }
        }
      } else {
        try {
          fs.unlinkSync("./uploads/" + fileName)
        } catch (err) {
          console.error(err)
        }
      }
      sharedLib.deleteCalendar(cal);
    })
    if (database.length !== 0) {
      database = database.substring(0, database.length - 1);
    }

    if (files.length === 0) {
      res.send(JSON.parse("[]"));
    } else {
      database += ']';
      res.send(database);
    }
  });
});

app.get('/addEvent', function(req, res) {
  let creationDate = req.query.creationDate;
  let creationTime = req.query.creationTime;
  let startDate = req.query.startDate;
  let startTime = req.query.startTime;
  let utc = req.query.utc;
  let uid = req.query.uid;
  let summary = req.query.summary;
  let fileName = req.query.fileName;


  if (!fs.existsSync("./uploads/" + fileName)) {
    return res.status(404).send('404');
  }

  let tempCal = ref.alloc(CalendarPtrPtr);
  let errorCode = sharedLib.createCalendar("./uploads/" + req.query.fileName, tempCal);
  let cal = tempCal.deref();
  let eventJson = sharedLib.getAddedEvent("./uploads/" + fileName, cal, startDate, startTime, creationDate, creationTime, uid, summary, utc);
  eventJson = eventJson.replace(/\\n/g, "\\n")
    .replace(/\\'/g, "\\'")
    .replace(/\\"/g, '\\"')
    .replace(/\\&/g, "\\&")
    .replace(/\\r/g, "\\r")
    .replace(/\\t/g, "\\t")
    .replace(/\\b/g, "\\b")
    .replace(/\\f/g, "\\f");
  eventJson = eventJson.replace(/[\u0000-\u0019]+/g, "");
  eventJson = JSON.parse(eventJson);
  sharedLib.deleteCalendar(cal);
  res.send(eventJson);
});

app.get('/addCalendar', function(req, res) {
  let creationDate = req.query.creationDate;
  let creationTime = req.query.creationTime;
  let startDate = req.query.startDate;
  let startTime = req.query.startTime;
  let utc = req.query.utc;
  let uid = req.query.uid;
  let summary = req.query.summary;
  let fileName = req.query.fileName;
  let version = req.query.version;
  let prodID = req.query.prodID
  let tempCal = ref.alloc(CalendarPtrPtr);
  let errorCode = sharedLib.createCalendar("./uploads/" + req.query.fileName, tempCal);
  let cal = tempCal.deref();
  let calJson = sharedLib.getAddedCal("./uploads/" + fileName, startDate, startTime, creationDate, creationTime, uid, summary, version, prodID, utc);
  calJson = calJson.replace(/\\n/g, "\\n")
    .replace(/\\'/g, "\\'")
    .replace(/\\"/g, '\\"')
    .replace(/\\&/g, "\\&")
    .replace(/\\r/g, "\\r")
    .replace(/\\t/g, "\\t")
    .replace(/\\b/g, "\\b")
    .replace(/\\f/g, "\\f");
  calJson = calJson.replace(/[\u0000-\u0019]+/g, "");
  calJson = JSON.parse(calJson);
  sharedLib.deleteCalendar(cal);
  res.send(calJson);
});


app.get('/clearData', function(req, res) {
  connection.query("DELETE FROM ALARM;", function(err, rows, fields) {});
  connection.query("ALTER TABLE ALARM AUTO_INCREMENT = 1 ;", function(err, rows, fields) {});
  connection.query("DELETE FROM EVENT;", function(err, rows, fields) {});
  connection.query("ALTER TABLE EVENT AUTO_INCREMENT = 1 ;", function(err, rows, fields) {});
  connection.query("DELETE FROM FILE;", function(err, rows, fields) {});
  connection.query("ALTER TABLE FILE AUTO_INCREMENT = 1 ;", function(err, rows, fields) {});
  connection.query("SELECT COUNT(*) AS fileCount FROM FILE;", function(err, rows, fields) {
    fCount = (rows[0].fileCount);
  });
  connection.query("SELECT COUNT(*) AS eventCount FROM EVENT;", function(err, rows, fields) {
    eCount = (rows[0].eventCount);
  });
  connection.query("SELECT COUNT(*) AS alarmCount FROM ALARM;", function(err, rows, fields) {
    aCount = (rows[0].alarmCount);
  });
  res.send(database);
});

app.get('/getStatus', function(req, res) {
  connection.query("SELECT COUNT(*) AS fileCount FROM FILE;", function(err, rows, fields) {
    fCount = (rows[0].fileCount);
  });
  connection.query("SELECT COUNT(*) AS eventCount FROM EVENT;", function(err, rows, fields) {
    eCount = (rows[0].eventCount);
  });
  connection.query("SELECT COUNT(*) AS alarmCount FROM ALARM;", function(err, rows, fields) {
    aCount = (rows[0].alarmCount);
  });
  let status = [];
  status.push(fCount);
  status.push(eCount);
  status.push(aCount)
  res.send(JSON.stringify(status));
});




app.get('/loadData', function(req, res) {
  let eventCount = 0;
  connection.query("DELETE FROM ALARM;", function(err, rows, fields) {});
  connection.query("ALTER TABLE ALARM AUTO_INCREMENT = 1 ;", function(err, rows, fields) {});
  connection.query("DELETE FROM EVENT;", function(err, rows, fields) {});
  connection.query("ALTER TABLE EVENT AUTO_INCREMENT = 1 ;", function(err, rows, fields) {});
  connection.query("DELETE FROM FILE;", function(err, rows, fields) {});
  connection.query("ALTER TABLE FILE AUTO_INCREMENT = 1 ;", function(err, rows, fields) {});
  console.log(database);
  let db = JSON.parse(database);
  for (let i = 0; i < db.length; i++) {
    connection.query("INSERT INTO FILE (`file_Name`, `version`, `prod_id`) VALUES ('" + db[i].fileName + "', '" + db[i].version + "', '" + db[i].prodID + "');", function(err, rows, fields) {});
    let tempCal = ref.alloc(CalendarPtrPtr);
    let errorCode = sharedLib.createCalendar("./uploads/" + db[i].fileName, tempCal);
    let cal = tempCal.deref();
    let eventListJson = sharedLib.calendarToEventListJSON(cal);
    eventListJson = eventListJson.replace(/\\n/g, "\\n")
      .replace(/\\'/g, "\\'")
      .replace(/\\"/g, '\\"')
      .replace(/\\&/g, "\\&")
      .replace(/\\r/g, "\\r")
      .replace(/\\t/g, "\\t")
      .replace(/\\b/g, "\\b")
      .replace(/\\f/g, "\\f");
    eventListJson = eventListJson.replace(/[\u0000-\u0019]+/g, "");
    eventListJson = JSON.parse(eventListJson);
    for (let j = 0; j < eventListJson.length; j++) {
      eventCount++;

      let date = (eventListJson[j].startDT.date);
      date = date.replace(/(\w{4})(\w{2})(\w{2})/, '$1-$2-$3');
      let time = (eventListJson[j].startDT.time);
      time = time.replace(/(\w{2})(\w{2})(\w{2})/, '$1:$2:$3');
      let dateTime = date + "T" + time;
      connection.query("INSERT INTO EVENT (`summary`, `start_time`,`location`,`organizer`,`cal_file`) VALUES ('" + eventListJson[j].summary + "', '" + dateTime + "', '" + eventListJson[j].location + "', '" + eventListJson[j].organizer + "','" + (i + 1) + "');", function(err, rows, fields) {});
      if (eventListJson[j].summary == "") {
        connection.query("UPDATE `EVENT` SET `summary` = NULL WHERE (`event_id` = '" + eventCount + "');", function(err, rows, fields) {});
      }
      if (eventListJson[j].location == "") {
        connection.query("UPDATE `EVENT` SET `location` = NULL WHERE (`event_id` = '" + eventCount + "');", function(err, rows, fields) {});
      }
      if (eventListJson[j].organizer == "") {
        connection.query("UPDATE `EVENT` SET `organizer` = NULL WHERE (`event_id` = '" + eventCount + "');", function(err, rows, fields) {});
      }
      let alarmListJson = sharedLib.eventToAlarmList(cal, j + 1);
      alarmListJson = alarmListJson.replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");
      alarmListJson = alarmListJson.replace(/[\u0000-\u0019]+/g, "");
      alarmListJson = JSON.parse(alarmListJson);
      for (let k = 0; k < alarmListJson.length; k++) {
        connection.query("INSERT INTO `ALARM` (`action`, `trigger`, `event`) VALUES ('" + alarmListJson[k].action + "', '" + alarmListJson[k].trigger + "', '" + eventCount + "');", function(err, rows, fields) {});
      }
    }
    sharedLib.deleteCalendar(cal);
  }
  connection.query("SELECT COUNT(*) AS fileCount FROM FILE;", function(err, rows, fields) {
    fCount = (rows[0].fileCount);
  });
  connection.query("SELECT COUNT(*) AS eventCount FROM EVENT;", function(err, rows, fields) {
    eCount = (rows[0].eventCount);
  });
  connection.query("SELECT COUNT(*) AS alarmCount FROM ALARM;", function(err, rows, fields) {
    aCount = (rows[0].alarmCount);
  });
  dataFiles.length = 0;
  connection.query("SELECT * from FILE;", function(err, rows, fields) {
    for (let row of rows) {
      dataFiles.push(row.file_Name);
    }
    console.log(dataFiles);
    res.send(JSON.stringify(dataFiles));
  });

});


app.get('/clearData', function(req, res) {
  connection.query("DELETE FROM ALARM;", function(err, rows, fields) {});
  connection.query("ALTER TABLE ALARM AUTO_INCREMENT = 1 ;", function(err, rows, fields) {});
  connection.query("DELETE FROM EVENT;", function(err, rows, fields) {});
  connection.query("ALTER TABLE EVENT AUTO_INCREMENT = 1 ;", function(err, rows, fields) {});
  connection.query("DELETE FROM FILE;", function(err, rows, fields) {});
  connection.query("ALTER TABLE FILE AUTO_INCREMENT = 1 ;", function(err, rows, fields) {});
  connection.query("SELECT COUNT(*) AS fileCount FROM FILE;", function(err, rows, fields) {
    fCount = (rows[0].fileCount);
  });
  connection.query("SELECT COUNT(*) AS eventCount FROM EVENT;", function(err, rows, fields) {
    eCount = (rows[0].eventCount);
  });
  connection.query("SELECT COUNT(*) AS alarmCount FROM ALARM;", function(err, rows, fields) {
    aCount = (rows[0].alarmCount);
  });
  res.send(JSON.parse(database));
});


app.post('/fileTable', function(req, res) {
  connection.query("CREATE TABLE FILE(cal_id INT auto_increment primary key,file_Name VARCHAR(60) NOT NULL,version INT NOT NULL,	prod_id VARCHAR(256) NOT NULL);", function(err, rows, fields) {
    if (err) {
      return res.status(409).send('File table already exists');
    } else {
      return res.status(200).send('File table created');
    }
  });
});


app.post('/eventTable', function(req, res) {
  connection.query("CREATE TABLE EVENT(event_id INT AUTO_INCREMENT PRIMARY KEY,summary VARCHAR(1024),start_time DATETIME NOT NULL,	location VARCHAR(60),organizer VARCHAR(256),cal_file int NOT NULL,FOREIGN KEY(cal_file)REFERENCES FILE(cal_id)ON DELETE CASCADE);", function(err, rows, fields) {
    if (err) {
      return res.status(409).send('Event table already exists');
    } else {
      return res.status(200).send('Event table created');
    }
  });
});

app.post('/alarmTable', function(req, res) {
  connection.query("CREATE TABLE ALARM(alarm_id INT AUTO_INCREMENT PRIMARY KEY,action VARCHAR(256) NOT NULL,`trigger` VARCHAR(256) NOT NULL,event INT NOT NULL,FOREIGN KEY(event)REFERENCES EVENT(event_id) ON DELETE CASCADE	);", function(err, rows, fields) {
    if (err) {
      return res.status(409).send('Alarm table already exists');
    } else {
      return res.status(200).send('Alarm table created');
    }
  });
});

app.get('/login', function(req, res) {
  connection = mysql.createConnection({
    host: 'dursley.socs.uoguelph.ca',
    user: req.query.user,
    password: req.query.pass,
    database: req.query.db
  });
  connection.connect(function(err) {
    if (err) {
      console.log("Invalid database credentials");
      return res.status(401).send('Invalid credentials');
    } else {
      console.log("Connected");
      dataFiles.length = 0;
      connection.query("SELECT * from FILE;", function(err, rows, fields) {
        if (err){
          res.send("{}");
        }else{
          for (let row of rows) {
            dataFiles.push(row.file_Name);
          }
          res.send(JSON.stringify(dataFiles));
        }
      });

    }
  });
});


app.get('/byStartDate', function(req, res) {
  connection.query("SELECT * from EVENT ORDER BY start_time asc;", function(err, rows, fields) {
    let query = [];
    for (let row of rows) {
      let temp = {
        "event_id": row.event_id,
        "summary": row.summary,
        "start_time": row.start_time,
        "location": row.location,
        "organizer": row.organizer,
        "cal_file": row.cal_file
      };
      query.push(temp);
    }
    res.send(query);
  });
});

app.get('/byFile', function(req, res) {
  console.log(req.query.index);
  connection.query("SELECT * from EVENT where cal_file =" + req.query.index + ";", function(err, rows, fields) {
    let query = [];
    for (let row of rows) {
      let temp = {
        "summary": row.summary,
        "start_time": row.start_time
      };
      query.push(temp);
    }
    res.send(query);
  });
});

app.get('/byConflict', function(req, res) {
  connection.query("SELECT i.* FROM EVENT i JOIN (SELECT start_time, COUNT(*) FROM EVENT GROUP BY start_time HAVING COUNT(start_time) > 1) j ON i.start_time = j.start_time ORDER by i.start_time;", function(err, rows, fields) {
    let query = [];
    for (let row of rows) {
      let temp = {
        "event_id": row.event_id,
        "summary": row.summary,
        "start_time": row.start_time,
        "location": row.location,
        "organizer": row.organizer,
        "cal_file": row.cal_file
      };
      query.push(temp);
    }
    res.send(query);
  });
});

app.get('/byAlarm', function(req, res) {
  connection.query("SELECT event_id,organizer,action,`trigger` FROM EVENT, ALARM WHERE (EVENT.event_id=ALARM.event);", function(err, rows, fields) {
    let query = [];
    for (let row of rows) {
      let temp = {
        "event_id": row.event_id,
        "organizer": row.organizer,
        "action": row.action,
        "trigger": row.trigger,
      };
      query.push(temp);
    }
    res.send(query);
  });
});

app.get('/byDistinct', function(req, res) {
  connection.query("SELECT DISTINCT b.location, b.organizer FROM EVENT AS a CROSS JOIN EVENT AS b WHERE a.location='guelph' and b.location='guelph';", function(err, rows, fields) {
    let query = [];
    for (let row of rows) {
      let temp = {
        "location": row.location,
        "organizer": row.organizer,
      };
      query.push(temp);
    }
    res.send(query);
  });
});

app.get('/byTime', function(req, res) {
  connection.query("SELECT * FROM EVENT WHERE EVENT.start_time> '"+req.query.date+"';", function(err, rows, fields) {
    let query = [];
    for (let row of rows) {
      let temp = {
        "event_id": row.event_id,
        "summary": row.summary,
        "start_time": row.start_time,
        "location": row.location,
        "organizer": row.organizer,
        "cal_file": row.cal_file
      };
      query.push(temp);
    }
    res.send(query);
  });
});



app.listen(portNum);
console.log('Running app at localhost: ' + portNum);
