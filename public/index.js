// Put all onload AJAX calls here, and event listeners

$(document).ready(function() {
  let dbList = [];
  let list = [];
  let eventsLength = 0;
  let totalFiles = 0;
  let lastClicked;
  let status = document.getElementById("statusText");
  let fileLog = document.getElementById("fileLogHeader");
  let dt;
  let time;

  let databaseFiles = 0;
  let databaseEvents = 0;
  let databaseAlarms = 0;

  $.ajax({
    type: 'get',
    dataType: 'JSON',
    url: '/getFiles',
    success: function(data) {
      totalFiles = data.length;
      fileLog.innerHTML = "File Log (" + totalFiles + ")";
      for (let i = 0; i < totalFiles; i++) {
        list.push(data[i].fileName);
        $('#fileTable tr:last').after('<tr id = "' + data[i].fileName + '"><td><a href="/uploads/' + data[i].fileName + '">' + data[i].fileName + '</a></td>' +
          '<td id = "' + data[i].fileName + '.version">' + data[i].version + '</td>' +
          '<td id = "' + data[i].fileName + '.prodid">' + data[i].prodID + '</td>' +
          '<td id = "' + data[i].fileName + '.events">' + data[i].numEvents + '</td>' +
          '<td id = "' + data[i].fileName + '.props">' + data[i].numProps + '</td>' +
          '</tr>');
        $("#selector").append(new Option(data[i].fileName, data[i].fileName));
      }
      $("#head").fadeIn();
      $("#fileLogHeader").fadeIn();
      if (list.length === 0) {
        $('#fileTable tr:last').after('<tr><td>No files on server</td>' +
          '<td >N/A</td>' +
          '<td >N/A</td>' +
          '<td >N/A</td>' +
          '<td >N/A</td>' +
          '</tr>');
      } else {
        $("#calHeader").fadeIn();

        $("#selectorHider").slideDown("slow", function() {});
      }
      $("#loginPanel").slideDown("slow", function() {});
      $("#datHeader").fadeIn();

      $("#tableScroll").slideDown("slow", function() {});
      $("#uploadHider").slideDown("slow", function() {});

    }
  });

  $('#clear').click(function(e) {
    status.innerHTML = "";
  });

  $('#propConfirm').click(function(e) {
    $("#selector").val(lastClicked);
    $("#alarmHider").slideUp("slow", function() {});
    $("#alarmHeader").slideUp("slow", function() {});
    let val = $("#selector").val();
    let index = $("#eventDropdown").val();
    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append("-------------------------------------------------------------");
    status.appendChild(document.createElement("br"));
    status.append(time + " - Viewing '" + lastClicked + "' Event #" + (index) + " optional properties");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
    let pass = {
      "name": lastClicked,
      "index": index
    };
    $.ajax({
      type: 'get',
      url: '/getEventProps',
      dataType: 'json',
      data: pass,
      success: function(data) {
        $("#newCal").slideUp("fast", function() {});
        $("#newEvent").slideUp("fast", function() {});
        $("#propHeader").slideDown("slow", function() {});
        $("#propHider").slideDown("slow", function() {});
        $("#eventProps td").parent().remove();

        if (data.length == 0) {
          dt = new Date();
          time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
          status.append(time + " - Error, '" + lastClicked + "' Event #" + (index) + " has no optional properties");
          status.appendChild(document.createElement("br"));
          document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;

          $('#eventProps tr:last').after('<tr><td>No properties</td>' +
            '<td >N/A</td>' +
            '<td >N/A</td>' +
            '</tr>');
        } else {
          $("#eventProps td").parent().remove();
        }
        for (let i = 0; i < data.length; i++) {
          $('#eventProps tr:last').after('<tr><td>' + (i + 1) + '</td>' +
            '<td id = "' + data[i].propName + '.description">' + data[i].propName + '</td>' +
            '<td id = "' + data[i] + '.description">' + data[i].description + '</td>' +
            '</tr>');
        }

      },
      error: function(error) {
        if (error.responseText === '404') {
          status.append(time + " - Error, unspecified calendar does not exist on server. Reloading page...");
          status.appendChild(document.createElement("br"));
          document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          setTimeout(location.reload.bind(location), 3000);
        }
      }
    });
  });

  $('#alarmConfirm').click(function(e) {
    $("#selector").val(lastClicked);
    $("#propHeader").slideUp("slow", function() {});
    $("#propHider").slideUp("slow", function() {});
    let val = $("#selector").val();
    let index = $("#eventDropdown").val();
    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append("-------------------------------------------------------------");
    status.appendChild(document.createElement("br"));
    status.append(time + " - Viewing '" + lastClicked + "' Event #" + (index) + " alarms");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
    let pass = {
      "name": lastClicked,
      "index": index
    };
    $.ajax({
      type: 'get',
      url: '/getEventAlarms',
      dataType: 'json',
      data: pass,
      success: function(data) {
        $("#newCal").slideUp("fast", function() {});
        $("#newEvent").slideUp("fast", function() {});
        $("#alarmHider").slideDown("slow", function() {});
        $("#alarmHeader").slideDown("slow", function() {});
        $("#eventAlarms td").parent().remove();
        if (data.length == 0) {
          dt = new Date();
          time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
          status.append(time + " - Error, '" + lastClicked + "' Event #" + (index) + " has no alarms");
          status.appendChild(document.createElement("br"));
          document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          $('#eventAlarms tr:last').after('<tr><td>No Alarms</td>' +
            '<td >N/A</td>' +
            '<td >N/A</td>' +
            '<td >N/A</td>' +
            '</tr>');
        } else {
          $("#eventAlarms td").parent().remove();
        }


        for (let i = 0; i < data.length; i++) {
          $('#eventAlarms tr:last').after('<tr><td>' + (i + 1) + '</td>' +
            '<td id = "' + data[i].action + '.description">' + data[i].action + '</td>' +
            '<td id = "' + data[i].trigger + '.description">' + data[i].trigger + '</td>' +
            '<td id = "' + data[i].numProps + '.description">' + data[i].numProps + '</td>' +
            '</tr>');
        }

      },
      error: function(error) {
        if (error.responseText === '404') {
          status.append(time + " - Error, unspecified calendar does not exist on server. Reloading page...");
          status.appendChild(document.createElement("br"));
          document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          setTimeout(location.reload.bind(location), 3000);
        }
      }
    });
  });

  $('#calendarConfirm').click(function(e) {
    e.preventDefault();
    let val = $("#selector").val();
    if ($("#selector").val() === null) {
      return;
    }
    lastClicked = val;
    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append("-------------------------------------------------------------");
    status.appendChild(document.createElement("br"));
    status.append(time + " - Viewing '" + val + "'");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
    $("#propHeader").slideUp("slow", function() {});
    $("#propHider").slideUp("slow", function() {});
    $("#alarmHider").slideUp("slow", function() {});
    $("#alarmHeader").slideUp("slow", function() {});
    $("#newCal").slideUp("fast", function() {});
    $("#newEvent").slideUp("fast", function() {});
    $("#calHeader").show();
    $("#calTable").slideDown("fast", function() {});
    $("#calHider").slideDown("fast", function() {});
    $("#calHider").slideUp("fast", function() {});
    $("#calTable").slideUp("fast", function() {});
    $("#calTable").slideDown("slow", function() {});
    $("#calHider").slideDown("slow", function() {});
    $("#calTable td").parent().remove();
    $("#eventDropdown").empty();
    document.getElementById('calHeader').innerHTML = val;
    let pass = {
      "name": val
    };
    $.ajax({
      type: 'get',
      url: '/getCalEvents',
      dataType: 'json',
      data: pass,
      success: function(data) {
        eventsLength = data.length;
        for (let i = 0; i < data.length; i++) {
          let date = (data[i].startDT.date);
          date = date.replace(/(\w{4})(\w{2})(\w{2})/, '$1-$2-$3');
          let time = (data[i].startDT.time);
          time = time.replace(/(\w{2})(\w{2})(\w{2})/, '$1:$2:$3');
          if (data[i].startDT.isUTC === true) {
            time = time + " (UTC)"
          }
          $('#calTable tr:last').after('<tr><td>' + (i + 1) + ' </td>' +
            '<td id = "' + data[i].startDT.date + '.date">' + date + '</td>' +
            '<td id = "' + data[i].startDT.time + '.time">' + time + '</td>' +
            '<td id = "' + data[i].summary + '.summary">' + data[i].summary + '</td>' +
            '<td id = "' + data[i].numProps + '.props">' + data[i].numProps + '</td>' +
            '<td id = "' + data[i].numAlarms + '.alarms">' + data[i].numAlarms + '</td>' +
            '</tr>');
          $("#eventDropdown").append(new Option("Event " + (i + 1), (i + 1)));
        }
        $("#postFilePick").slideDown("slow", function() {});
        $("#addEventHider").show();
      },
      error: function(error) {
        if (error.responseText === '404') {
          status.append(time + " - Error, unspecified calendar does not exist on server. Reloading page...");
          status.appendChild(document.createElement("br"));
          document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          setTimeout(location.reload.bind(location), 3000);
        }
      }
    });
  });

  $('#fileConfirm').click(function(e) {
    e.preventDefault();
    let filename = $('input[type=file]').val().replace(/C:\\fakepath\\/i, '')
    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append("-------------------------------------------------------------");
    status.appendChild(document.createElement("br"));
    status.append(time + " - Uploading '" + filename + "' ...");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
    $.ajax({
      url: '/upload', // this functionality was given to us in app.js
      type: 'POST',
      data: new FormData($('#fileForm')[0]),
      cache: false,
      contentType: false,
      processData: false,
      xhr: function() {
        return $.ajaxSettings.xhr();
      },
      success: function() {
        let pass = {
          "name": filename
        };
        $.ajax({
          type: 'get',
          url: '/getCalInfo',
          dataType: 'json',
          data: pass,
          success: function(data) {
            totalFiles++;
            fileLog.innerHTML = "File Log (" + totalFiles + ")";
            dt = new Date();
            time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            status.append("-------------------------------------------------------------");
            status.appendChild(document.createElement("br"));
            status.append(time + " - '" + filename + "' uploaded");
            status.appendChild(document.createElement("br"));
            list.push(filename);
            document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;

            if (list.length - 1 === 0) {
              $("#fileTable td").parent().remove();
              $("#calHeader").fadeIn();
              $("#selectorHider").fadeIn();
              $("#postLogin").fadeIn();
            }

            $('#fileTable tr:last').after('<tr><td><a href="/uploads/' + filename + '">' + filename + '</a></td>' +
              '<td>' + data.version + '</td>' +
              '<td>' + data.prodID + '</td>' +
              '<td>' + data.numEvents + '</td>' +
              '<td>' + data.numProps + '</td>' +
              '</tr>');
            $("#selector").append(new Option(filename, filename));
            document.getElementById('tableScroll').scrollTop = document.getElementById('tableScroll').scrollHeight;
          },
          error: function(error) {
            dt = new Date();
            time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            if (error.responseText === '1') {
              status.append(time + " - Error, '" + filename + "' is an invalid file");
            } else if (error.responseText === '2') {
              status.append(time + " - Error, '" + filename + "' is an invalid calendar");
            } else if (error.responseText === '3') {
              status.append(time + " - Error, '" + filename + "' has an invalid version");
            } else if (error.responseText === '4') {
              status.append(time + " - Error, '" + filename + "' has a duplicate version");
            } else if (error.responseText === '5') {
              status.append(time + " - Error, '" + filename + "' has an invalid product id");
            } else if (error.responseText === '6') {
              status.append(time + " - Error, '" + filename + "' has an duplicate product id");
            } else if (error.responseText === '7') {
              status.append(time + " - Error, '" + filename + "' has an invalid event");
            } else if (error.responseText === '8') {
              status.append(time + " - Error, '" + filename + "' has an invalid date time");
            } else if (error.responseText === '9') {
              status.append(time + " - Error, '" + filename + "' has an invalid alarm");
            } else if (error.responseText === '11') {
              status.append(time + " - Error, '" + filename + "' has an unspecified error");
            }
            status.appendChild(document.createElement("br"));
            document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;

          }
        });
      },
      error: function(error) {
        dt = new Date();
        time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        if (error.status == 409) {
          status.append(time + " - Error, duplicate of '" + filename + "' found on server");
          status.appendChild(document.createElement("br"));
          document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
        } else if (error.status == 400) {
          status.append(time + " - Error, no file selected");
          status.appendChild(document.createElement("br"));
          document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
        } else if (error.status == 422) {
          status.append(time + " - Error, '" + filename + "' is an invalid file");
          status.appendChild(document.createElement("br"));
          document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
        }
      }
    });
  });

  $('#addEvent').click(function(e) {
    $('#create-evt').trigger("reset");
    $("#newCal").slideUp("fast", function() {});
    $("#newEvent").slideDown("slow", function() {});

    $("#selector").val(lastClicked);
    e.preventDefault();
    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append("-------------------------------------------------------------");
    status.appendChild(document.createElement("br"));
    status.append(time + " - Adding new event to " + "'" + lastClicked + "'");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
    $("#propHeader").slideUp("slow", function() {});
    $("#propHider").slideUp("slow", function() {});
    $("#alarmHider").slideUp("slow", function() {});
    $("#alarmHeader").slideUp("slow", function() {});
  });

  $('#addCalendar').click(function(e) {
    $('#create-cal').trigger("reset");
    if (lastClicked !== undefined) {
      $("#selector").val(lastClicked);
    }
    $("#newEvent").slideUp("fast", function() {});
    $("#newCal").slideDown("slow", function() {});

    e.preventDefault();
    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append("-------------------------------------------------------------");
    status.appendChild(document.createElement("br"));
    status.append(time + " - Creating new calendar");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
    $("#propHeader").slideUp("slow", function() {});
    $("#propHider").slideUp("slow", function() {});
    $("#alarmHider").slideUp("slow", function() {});
    $("#alarmHeader").slideUp("slow", function() {});
  });

  $('#submitNewEvent').click(function(e) {
    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
    let error = false;
    let startDate = $("#eventDate").val();
    let startTime = $("#eventTime").val();;
    let summary = $("#eventSummary").val();;
    summary = summary.trim();
    let utc;
    let uid;
    let month = dt.getMonth() + 1;
    let day = dt.getDate();
    let hour = dt.getHours();
    let minute = dt.getMinutes();
    let second = dt.getSeconds();
    let creationDate = dt.getFullYear() +
      (('' + month).length < 2 ? '0' : '') + month +
      (('' + day).length < 2 ? '0' : '') + day;
    let creationTime = (('' + hour).length < 2 ? '0' : '') + hour +
      (('' + minute).length < 2 ? '0' : '') + minute +
      (('' + second).length < 2 ? '0' : '') + second;
    if (document.getElementById('addEventUTC').checked) {
      utc = 1;
    } else {
      utc = 0;
    }
    if (!startDate) {
      dt = new Date();
      time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
      status.append(time + " - Error, empty start date");
      status.appendChild(document.createElement("br"));
      document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      error = true;
    }
    if (!startTime) {
      dt = new Date();
      time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
      status.append(time + " - Error, empty start time");
      status.appendChild(document.createElement("br"));
      document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      error = true;
    }
    if (error === true) {
      status.appendChild(document.createElement("br"));
      return;
    }
    startDate = startDate.replace(/-/g, "");
    startTime = startTime.replace(/:/g, "") + '00';
    uid = (startDate + startTime + creationDate + creationTime);
    let pass = {
      "creationDate": creationDate,
      "creationTime": creationTime,
      "startDate": startDate,
      "creationDate": creationDate,
      "startTime": startTime,
      "utc": utc,
      "uid": uid,
      "summary": summary,
      "fileName": lastClicked
    };

    $.ajax({
      type: 'get',
      url: '/addEvent',
      dataType: 'json',
      data: pass,
      success: function(data) {
        if (data === null) {
          return;
        }
        let date = (data.startDT.date);
        date = date.replace(/(\w{4})(\w{2})(\w{2})/, '$1-$2-$3');
        let time = (data.startDT.time);
        time = time.replace(/(\w{2})(\w{2})(\w{2})/, '$1:$2:$3');
        if (data.startDT.isUTC === true) {
          time = time + " (UTC)"
        }
        eventsLength++;
        $("#eventDropdown").append(new Option("Event " + (eventsLength), (eventsLength)));
        document.getElementById(lastClicked + ".events").innerHTML = (eventsLength);
        $('#calTable tr:last').after('<tr><td>' + (eventsLength) + ' </td>' +
          '<td id = "' + data.startDT.date + '.date">' + date + '</td>' +
          '<td id = "' + data.startDT.time + '.time">' + time + '</td>' +
          '<td id = "' + data.summary + '.summary">' + data.summary + '</td>' +
          '<td id = "' + data.numProps + '.props">' + data.numProps + '</td>' +
          '<td id = "' + data.numAlarms + '.alarms">' + data.numAlarms + '</td>' +
          '</tr>');
        document.getElementById('calHider').scrollTop = document.getElementById('calHider').scrollHeight;
        $("#alarmHider").slideUp("slow", function() {});
        dt = new Date();
        time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        status.append(time + " - Event #" + eventsLength + " successfully added to " + lastClicked);
        status.appendChild(document.createElement("br"));
        document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
        $("#newEvent").slideUp("slow", function() {});
      },
      error: function(error) {
        if (error.responseText === '404') {
          status.append(time + " - Error, unspecified calendar does not exist on server. Reloading page...");
          status.appendChild(document.createElement("br"));
          document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          setTimeout(location.reload.bind(location), 3000);
        }
      }
    });
  });

  $('#submitNewCal').click(function(e) {
    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
    let error = false;
    let fileName = $("#file-name").val().trim();
    let version = $("#version").val().trim();
    let prodID = $("#prod-id").val().trim();
    let startDate = $("#calDate").val();
    let startTime = $("#calTime").val();
    let summary = $("#calSummary").val().trim();
    let utc;
    let uid;
    let month = dt.getMonth() + 1;
    let day = dt.getDate();
    let hour = dt.getHours();
    let minute = dt.getMinutes();
    let second = dt.getSeconds();
    let creationDate = dt.getFullYear() +
      (('' + month).length < 2 ? '0' : '') + month +
      (('' + day).length < 2 ? '0' : '') + day;
    let creationTime = (('' + hour).length < 2 ? '0' : '') + hour +
      (('' + minute).length < 2 ? '0' : '') + minute +
      (('' + second).length < 2 ? '0' : '') + second;
    if (document.getElementById('addCalUTC').checked) {
      utc = 1;
    } else {
      utc = 0;
    }
    if (!fileName) {
      dt = new Date();
      time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
      status.append(time + " - Error, empty file name");
      status.appendChild(document.createElement("br"));
      document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      error = true;
    } else if (fileName[fileName.length - 1] !== 's' && fileName[fileName.length - 2] !== 'c' && fileName[fileName.length - 3] !== 'i' && fileName[fileName.length - 4] !== '.') {
      dt = new Date();
      time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
      status.append(time + " - Error, file name has incorrect extension");
      status.appendChild(document.createElement("br"));
      document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      error = true;
    } else {
      for (let y = 0; y < list.length; y++) {
        if (list[y].toUpperCase() === fileName.toUpperCase()) {
          dt = new Date();
          time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
          status.append(time + " - Error, file name already exists");
          status.appendChild(document.createElement("br"));
          document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          error = true;
        }
      }
    }
    if (!version) {
      dt = new Date();
      time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
      status.append(time + " - Error, empty version");
      status.appendChild(document.createElement("br"));
      document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      error = true;
    } else if (isNaN(version)) {
      dt = new Date();
      time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
      status.append(time + " - Error, version input is not a number");
      status.appendChild(document.createElement("br"));
      document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      error = true;
    }
    if (!prodID) {
      dt = new Date();
      time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
      status.append(time + " - Error, empty product id");
      status.appendChild(document.createElement("br"));
      document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      error = true;
    }
    if (prodID.length >= 1000) {
      dt = new Date();
      time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
      status.append(time + " - Error, product id exceeds 1000 characters");
      status.appendChild(document.createElement("br"));
      document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      error = true;
    }
    if (!startDate) {
      dt = new Date();
      time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
      status.append(time + " - Error, empty start date");
      status.appendChild(document.createElement("br"));
      document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      error = true;
    }
    if (!startTime) {
      dt = new Date();
      time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
      status.append(time + " - Error, empty start time");
      status.appendChild(document.createElement("br"));
      document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      error = true;
    }
    if (error === true) {
      return;
    }
    startDate = startDate.replace(/-/g, "");
    startTime = startTime.replace(/:/g, "") + '00';
    uid = (startDate + startTime + creationDate + creationTime);
    let pass = {
      "creationDate": creationDate,
      "creationTime": creationTime,
      "startDate": startDate,
      "creationDate": creationDate,
      "startTime": startTime,
      "utc": utc,
      "uid": uid,
      "summary": summary,
      "fileName": fileName,
      "version": version,
      "prodID": prodID
    };
    $.ajax({
      type: 'get',
      url: '/addCalendar',
      dataType: 'json',
      data: pass,
      success: function(data) {
        totalFiles++;
        fileLog.innerHTML = "File Log (" + totalFiles + ")";
        list.push(fileName);
        if (list.length - 1 === 0) {
          $("#fileTable td").parent().remove();
          $("#calHeader").fadeIn();
          $("#selectorHider").fadeIn();
        }
        $("#selector").append(new Option(fileName, fileName));
        $('#fileTable tr:last').after('<tr id = "' + fileName + '"><td><a href="/uploads/' + fileName + '">' + fileName + '</a></td>' +
          '<td id = "' + fileName + '.version">' + data.version + '</td>' +
          '<td id = "' + fileName + '.prodid">' + data.prodID + '</td>' +
          '<td id = "' + fileName + '.events">' + data.numEvents + '</td>' +
          '<td id = "' + fileName + '.props">' + data.numProps + '</td>' +
          '</tr>');
        document.getElementById('tableScroll').scrollTop = document.getElementById('tableScroll').scrollHeight;
        dt = new Date();
        time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        status.append(time + " - '" + fileName + "' successfully created");
        status.appendChild(document.createElement("br"));
        document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
        $("#newCal").slideUp("slow", function() {});
      }
    });
  });


  $('#loadData').click(function(e) {
    $("#fileQuery").empty();

    $.ajax({
      type: 'get',
      url: '/loadData',
      dataType: 'json',
      success: function(data) {
        dbList.length = 0;
        for (let i = 0; i < data.length; i++) {
          dbList.push(data[i].fileName);
        }
        dt = new Date();
        time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        status.append(time + " - Files successfully uploaded into database ");
        status.appendChild(document.createElement("br"));
        document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
        for (let i = 0; i < data.length; i++) {
          $("#fileQuery").append(new Option(data[i], i + 1));
        }
      }
    });
    $("#queries").fadeIn();
    $("html, body").animate({
      scrollTop: $(document).height()
    }, "slow");
  });

  $('#clearData').click(function(e) {
    $("#fileQuery").empty();

    $.ajax({
      type: 'get',
      url: '/clearData',
      dataType: 'json',
      success: function(data) {

        dt = new Date();
        time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        status.append(time + " - Database cleared");
        status.appendChild(document.createElement("br"));
        document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;

        $("#queries").slideUp("fast", function() {});
        $("#query1Hider").slideUp("fast", function() {});
        $("#query2Hider").slideUp("fast", function() {});
        $("#query3Hider").slideUp("fast", function() {});
        $("#query4Hider").slideUp("fast", function() {});
        $("#query5Hider").slideUp("fast", function() {});
        $("#query6Hider").slideUp("fast", function() {});



      },
      error: function() {
        $("#queries").fadeOut();
      }
    });
  });




  $('#displayStatus').click(function(e) {
    $.ajax({
      type: 'get',
      url: '/getStatus',
      dataType: 'json',
      success: function(data) {
        databaseFiles = data[0];
        databaseEvents = data[1];
        databaseAlarms = data[2];

        dt = new Date();
        time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        status.append(time + " - Database has " + data[0] + " files, " + data[1] + " events, and " + data[2] + " alarms");
        status.appendChild(document.createElement("br"));
        document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      }
    });
  });

  $('#login').click(function(e) {

    if ($("#data").val() == "") {
      dt = new Date();
      time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
      status.append(time + " - Invalid credentials");
      status.appendChild(document.createElement("br"));
      document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      return;
    }
    let pass = {
      "user": $("#user").val(),
      "pass": $("#pass").val(),
      "db": $("#data").val()
    };

    $.ajax({
      type: 'get',
      url: '/login',
      dataType: 'json',
      data: pass,
      success: function(data) {

        dt = new Date();
        time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        status.append(time + " - Logged into database, creating tables...");
        status.appendChild(document.createElement("br"));
        document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;



        $.ajax({
          type: 'post',
          url: '/fileTable',
          success: function(data) {
            dt = new Date();
            time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            status.append(time + " - File table successfully created");
            status.appendChild(document.createElement("br"));
            document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          },
          error: function(data) {
            dt = new Date();
            time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            status.append(time + " - " + data.responseText);
            status.appendChild(document.createElement("br"));
            document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          }
        });


        $.ajax({
          type: 'post',
          url: '/eventTable',
          success: function(data) {
            dt = new Date();
            time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            status.append(time + " - Event table successfully created");
            status.appendChild(document.createElement("br"));
            document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          },
          error: function(data) {
            dt = new Date();
            time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            status.append(time + " - " + data.responseText);
            status.appendChild(document.createElement("br"));
            document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          }
        });

        $.ajax({
          type: 'post',
          url: '/alarmTable',
          success: function(data) {
            dt = new Date();
            time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            status.append(time + " - Alarm table successfully created");
            status.appendChild(document.createElement("br"));
            document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          },
          error: function(data) {
            dt = new Date();
            time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            status.append(time + " - " + data.responseText);
            status.appendChild(document.createElement("br"));
            document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
          }
        });


        $("#loginPanel").hide();
        if (list.length > 0) {
          $("#postLogin").fadeIn();
        }
        if (data.length > 0) {
          $("#queries").fadeIn();
        }

        $("#other").fadeIn();
        for (let i = 0; i < data.length; i++) {
          $("#fileQuery").append(new Option(data[i], i + 1));
        }

        $("html, body").animate({
          scrollTop: $(document).height()
        }, "slow");

      },
      error: function(err) {
        dt = new Date();
        time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        status.append(time + " - " + err.responseText);
        status.appendChild(document.createElement("br"));
        document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;
      }
    });
  });



  $('#byStartDate').click(function(e) {
    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append(time + " - Displaying all events by ascending start date");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;

    $.ajax({
      type: 'get',
      url: '/byStartDate',
      dataType: 'json',
      success: function(data) {
        $("#query1 td").parent().remove();
        $("#query3Hider").slideUp("fast", function() {});
        $("#query2Hider").slideUp("fast", function() {});
        $("#query4Hider").slideUp("fast", function() {});
        $("#query5Hider").slideUp("fast", function() {});
        $("#query6Hider").slideUp("fast", function() {});
        $("#query1Hider").slideDown("slow", function() {});
        for (let i = 0; i < data.length; i++) {
          $('#query1 tr:last').after('<tr>' +
            '<td>' + data[i].event_id + '</td>' +
            '<td>' + data[i].summary + '</td>' +
            '<td>' + data[i].start_time + '</td>' +
            '<td>' + data[i].location + '</td>' +
            '<td>' + data[i].organizer + '</td>' +
            '<td>' + data[i].cal_file + '</td>' +
            '</tr>');
        }
        $("html, body").animate({
          scrollTop: $(document).height()
        }, "slow");
      }
    });
  });


  $('#byFile').click(function(e) {
    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append(time + " - Displaying all events from selected file");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;

    let pass = {
      "index": $("#fileQuery").val()
    };
    $.ajax({
      type: 'get',
      url: '/byFile',
      dataType: 'json',
      data: pass,
      success: function(data) {
        $("#query2 td").parent().remove();
        $("#query3Hider").slideUp("fast", function() {});
        $("#query1Hider").slideUp("fast", function() {});
        $("#query4Hider").slideUp("fast", function() {});
        $("#query5Hider").slideUp("fast", function() {});
        $("#query6Hider").slideUp("fast", function() {});
        $("#query2Hider").slideDown("slow", function() {});

        for (let i = 0; i < data.length; i++) {
          $('#query2 tr:last').after('<tr>' +
          '<td>' + (i+1) + '</td>' +
            '<td>' + data[i].start_time + '</td>' +
            '<td>' + data[i].summary + '</td>' +
            '</tr>');
        }
        $("html, body").animate({
          scrollTop: $(document).height()
        }, "slow");


      }
    });
  });



  $('#byConflict').click(function(e) {
    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append(time + " - Displaying all events which may conflict with each other");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;

    $.ajax({
      type: 'get',
      url: '/byConflict',
      dataType: 'json',
      success: function(data) {
        $("#query3 td").parent().remove();
        $("#query1Hider").slideUp("fast", function() {});
        $("#query2Hider").slideUp("fast", function() {});
        $("#query4Hider").slideUp("fast", function() {});
        $("#query5Hider").slideUp("fast", function() {});
        $("#query6Hider").slideUp("fast", function() {});
        $("#query3Hider").slideDown("slow", function() {});
        for (let i = 0; i < data.length; i++) {
          $('#query3 tr:last').after('<tr>' +
            '<td>' + data[i].event_id + '</td>' +
            '<td>' + data[i].summary + '</td>' +
            '<td>' + data[i].start_time + '</td>' +
            '<td>' + data[i].location + '</td>' +
            '<td>' + data[i].organizer + '</td>' +
            '<td>' + data[i].cal_file + '</td>' +
            '</tr>');
        }
        $("html, body").animate({
          scrollTop: $(document).height()
        }, "slow");
      }
    });
  });

  $('#byAlarm').click(function(e) {

    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append(time + " - Displaying all alarms in events with the organizer");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;


    $.ajax({
      type: 'get',
      url: '/byAlarm',
      dataType: 'json',
      success: function(data) {
        $("#query4 td").parent().remove();
        $("#query1Hider").slideUp("fast", function() {});
        $("#query2Hider").slideUp("fast", function() {});
        $("#query3Hider").slideUp("fast", function() {});
        $("#query5Hider").slideUp("fast", function() {});
        $("#query6Hider").slideUp("fast", function() {});
        $("#query4Hider").slideDown("slow", function() {});
        for (let i = 0; i < data.length; i++) {
          $('#query4 tr:last').after('<tr>' +
            '<td>' + data[i].event_id + '</td>' +
            '<td>' + data[i].organizer + '</td>' +
            '<td>' + data[i].action + '</td>' +
            '<td>' + data[i].trigger + '</td>' +
            '</tr>');
        }
        $("html, body").animate({
          scrollTop: $(document).height()
        }, "slow");
      }
    });
  });


  $('#byDistinct').click(function(e) {

    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append(time + " - Displaying events in Guelph with distinct organizers");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;


    $.ajax({
      type: 'get',
      url: '/byDistinct',
      dataType: 'json',
      success: function(data) {
        $("#query5 td").parent().remove();
        $("#query1Hider").slideUp("fast", function() {});
        $("#query2Hider").slideUp("fast", function() {});
        $("#query3Hider").slideUp("fast", function() {});
        $("#query4Hider").slideUp("fast", function() {});
        $("#query6Hider").slideUp("fast", function() {});
        $("#query5Hider").slideDown("slow", function() {});
        for (let i = 0; i < data.length; i++) {
          $('#query5 tr:last').after('<tr>' +
            '<td>' + data[i].location + '</td>' +
            '<td>' + data[i].organizer + '</td>' +
            '</tr>');
        }
        $("html, body").animate({
          scrollTop: $(document).height()
        }, "slow");
      }
    });
  });


  $('#byTime').click(function(e) {

    dt = new Date();
    time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    status.append(time + " - Displaying events on or after selected date");
    status.appendChild(document.createElement("br"));
    document.getElementById('scrollStatus').scrollTop = document.getElementById('scrollStatus').scrollHeight;

    let pass = {
      "date": $("#queryDate").val(),
    };

    $.ajax({
      type: 'get',
      url: '/byTime',
      dataType: 'json',
      data:pass,
      success: function(data) {
        $("#query6 td").parent().remove();
        $("#query1Hider").slideUp("fast", function() {});
        $("#query2Hider").slideUp("fast", function() {});
        $("#query3Hider").slideUp("fast", function() {});
        $("#query4Hider").slideUp("fast", function() {});
        $("#query5Hider").slideUp("fast", function() {});
        $("#query6Hider").slideDown("slow", function() {});


        for (let i = 0; i < data.length; i++) {
          $('#query6 tr:last').after('<tr>' +
          '<td>' + data[i].event_id + '</td>' +
          '<td>' + data[i].summary + '</td>' +
          '<td>' + data[i].start_time + '</td>' +
          '<td>' + data[i].location + '</td>' +
          '<td>' + data[i].organizer + '</td>' +
          '<td>' + data[i].cal_file + '</td>' +
          '</tr>');
        }
        $("html, body").animate({
          scrollTop: $(document).height()
        }, "slow");
      }
    });
  });




});
