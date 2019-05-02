var fieldsToCheck = {
  webProperties: {
    prettyName: "Web Properties",
    url: "web-properties",
    secondaryChecks: {
      listExamples: {
        prettyName: "List examples",
        check: function(mine) {
          var webProps = configs[mine.namespace].webProperties["web-properties"];
          //console.log(mine.namespace, webProps);
          return checkNested(webProps, ["bag", "example", "identifiers", "default"])
        }
      }
    }
  }
}

//let's make the list of mines and responses globally accessible
var mines, configs = {};


//get all InterMines as soon as the DOM has loaded
document.addEventListener("DOMContentLoaded", function() {
  $.ajax("http://registry.intermine.org/service/instances?mines=all")
    .then(function(response) {
      //storing mines globally
      mines = response.instances;

      var minesList = document.getElementById("interMinesList"),
        headerRow = minesList.querySelector("thead tr");

      headerRow.innerHTML = generateHeader();

      //debug. remove when done.
      console.log(mines);

      //once everything is loaded, display a list of mines to the user
      mines.map(function(mine) {
        try {
          minesList.append(mineNode(mine));
          fetchConfig(mine);
        } catch (e) {
          console.log(e);
        }
      });
    });
});

/**
 * Generates HTML for each row associated with an InterMine
 **/
function mineNode(mine) {
  //Generate text for links to each mine.
  var mineNode = document.createElement("tr"),
    mineRow = "<td>" + mine.name + "</td>" +
    "<td>" + mine.api_version + "</td>";
  Object.keys(fieldsToCheck).map(function(fieldName) {
    mineRow += cellForField(fieldName);
    var secondaryChecks = fieldsToCheck[fieldName].secondaryChecks;
    if (secondaryChecks) {
      Object.keys(secondaryChecks).map(function(secondFieldName) {
        mineRow += cellForField(secondFieldName);
      });
    }
  });
  mineNode.setAttribute("class", "mineEntry");
  mineNode.setAttribute("id", mine.namespace);
  mineNode.innerHTML = mineRow;
  return mineNode;
}

/**
* Helper for the mineNode function
**/
function cellForField(fieldName) {
  return "<td class='" + fieldName + "'>Loading</td>";
}

/**
 * Create the header row dynamically depending on the fields we have
 * put in the settings.
 **/
function generateHeader() {
  var header = "<th>Mine Name</th> <th>API version</th>"
  Object.keys(fieldsToCheck).map(function(field) {
    header += cellForHeaderField(fieldsToCheck[field]);
    var secondaryChecks = fieldsToCheck[field].secondaryChecks;
    if (secondaryChecks) {
      Object.keys(secondaryChecks).map(function(secondFieldName) {
        header += cellForHeaderField(secondaryChecks[secondFieldName]);
      });
    }
  });
  return header;
}

/**
* Helper for the mineNode function
**/
function cellForHeaderField(fieldName) {
  console.log(fieldName);
  return "<th>" + fieldName.prettyName + "</th>"
}

/**
 * Fetches all configs we'd like to check from an InterMine - e.g.
 * does the web properties endpoint work? Uses promises to handle the huge
 * number of requests.
 **/
function fetchConfig(mine) {
  var thisMine = configs[mine.namespace] = {};
  Object.keys(fieldsToCheck).map(function(fieldName) {
    var field = fieldsToCheck[fieldName];
    thisMine[fieldName] = $.ajax(mine.url + "/service/" + field.url);
    thisMine[fieldName].done(function(response) {
      storeResultsandUpdate(mine, fieldName, response)
      executeSecondaryChecks(mine, field);
    });
    thisMine[fieldName].fail(function(response) {
      storeResultsandUpdate(mine, fieldName, false);
      executeSecondaryChecks(mine, field);
    });
  });
}

/**
* Once a config is fetched and the promise is resolved or failed,
show the value in the cell
**/
function updateCell(mine, cell) {
  var elem = document.getElementById(mine).getElementsByClassName(cell)[0];
  elem.innerHTML = configs[mine][cell] ? "Y" : "N"
}


/**
Copy/paste coding at its best. Checks for nested js properties.
Tweaked slightly from https://stackoverflow.com/a/2631198/1542891 -
thanks CMS for this answer! https://stackoverflow.com/users/5445/cms
**/
function checkNested(obj, propsArray) {
  for (var i = 0; i < propsArray.length; i++) {
    if (!obj || !obj.hasOwnProperty(propsArray[i])) {
      return false;
    }
    obj = obj[propsArray[i]];
  }
  return true;
}


/**
* Checks that don't require a get, just verifying data values / types etc based
 on a previous GET's results.
**/
function executeSecondaryChecks(mine, field) {
  var checks = field.secondaryChecks;
  if (checks) {
    Object.keys(checks).map(function(checkName) {
      var result = checks[checkName].check(mine);
      storeResultsandUpdate(mine, checkName, result);
    });
  }
}

/**
Once a check's results are returned, store in the config object
and update the visuals
**/
function storeResultsandUpdate(mine, field, result) {
  configs[mine.namespace][field] = result;
  updateCell(mine.namespace, field);
}
