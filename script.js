//HELLO THERE!

/**
if you'd like to add a new config to check, here's what to do.

1) to check for the EXISTENCE of an endpoint, add a top level property to
   the fieldsToCheck object below. Example:
   ```
   webProperties: {
     prettyName: "Web Properties",
     url: "web-properties"
   }
   ```
   This will go to each InterMine in the registry and call the endpoint you've
   specified, e.g. for flymine this would be
   GET http://www.flymine.org/flymine/service/web-properties
   The response will be stored in config under the webProperties,
   and we'll add a Y or N to the screen depending on whether or not we
   got a 200 OK response.

2) If you want to check for the existence of deeply nested properties within a
   response, add a secondaryChecks object to the property you created previously
   Example:
   ```
   webProperties: {
     prettyName: "Web Properties",
     url: "web-properties",
     secondaryChecks: {
       listExamplesDefault: {
         prettyName: "List example .identifiers .default (preferred)",
         check: function(mine) {
          var webProps = configs[mine.namespace].webProperties["web-properties"];
          return checkNested(webProps, ["bag", "example", "identifiers", "default"]);
         }
       }
     }
   }
   ```
   You can add as many secondary checks as you like to a single endpoint.
   each secondary check is comprised of its name/key
   (e.g. `listExamplesDefault` above) and two properties:
    - a "prettyName" for humans to read at the top of the
      results display tables
    - a `check` function. Use this to perform whatever function / checks
      you deem necessary, and return a falsey value if it's bad, or a truthy
      value if you like the result.

**/

var fieldsToCheck = {
  webProperties: {
    prettyName: "Web Properties",
    url: "web-properties",
    secondaryChecks: {
      listExamplesOld: {
        prettyName: "List example .identifiers (deprecated)",
        check: function(mine) {
          var webProps = configs[mine.namespace].webProperties["web-properties"],
            newConfig = checkNested(webProps, ["bag", "example", "identifiers", "default"]);
          oldConfig = checkNested(webProps, ["bag", "example", "identifiers"]);
          return oldConfig && !newConfig;
        }
      },
      listExamplesDefault: {
        //class-level identifiers are preferred but not all mines have them.
        //some may have the previous config (above) or none at all
        prettyName: "List example .identifiers .default (preferred)",
        check: function(mine) {
          var webProps = configs[mine.namespace].webProperties["web-properties"];
          return checkNested(webProps, ["bag", "example", "identifiers", "default"]);
        }
      },
      regionSearchDefaultOrganism: {
        prettyName: "Region Search Default Organism",
        check: function(mine) {
          var webProps = configs[mine.namespace].webProperties["web-properties"];
          return checkNested(webProps, ["genomicRegionSearch", "defaultOrganisms"]);
        }
      },
      regionSearchDefaultRegions: {
        prettyName: "Region Search Default Regions",
        check: function(mine) {
          var webProps = configs[mine.namespace].webProperties["web-properties"];
          return checkNested(webProps, ["genomicRegionSearch", "defaultSpans"]);
        }
      },
      qbDefaultQuery: {
        prettyName: "Query Builder Default Query",
        check: function(mine) {
          var webProps = configs[mine.namespace].webProperties["web-properties"];
          return checkNested(webProps, ["services", "defaults", "query"]);
        }
      },
      delimiters: {
        prettyName: "List Delimiters",
        check: function(mine) {
          var webProps = configs[mine.namespace].webProperties["web-properties"];
          return checkNested(webProps, ["list", "upload", "delimiters"]);
        }
      },
      searchDefaults: {
        prettyName: "Search Defaults",
        check: function(mine) {
          var webProps = configs[mine.namespace].webProperties["web-properties"];
          return checkNested(webProps, ["quickSearch", "identifiers"]);
        }
      }
    }
  },
  branding: {
    prettyName: "Branding",
    url: "branding",
    secondaryChecks: {
      colors: {
        prettyName: "Branding .colors",
        check: function(mine) {
          var props = configs[mine.namespace].branding.properties;
          return checkNested(props, ["colors", "header"]);
        }
      },
      logo: {
        prettyName: "Branding .images .logo (preferred)",
        check: function(mine) {
          var props = configs[mine.namespace].branding.properties;
          return checkNested(props, ["images", "logo"]);
        }
      },
      oldLogo: {
        prettyName: "Branding .images .main (deprecated)",
        check: function(mine) {
          var props = configs[mine.namespace].branding.properties;
          return checkNested(props, ["images", "main"]);
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
      mines.sort(function(mineA, mineB) {
        return (mineB.api_version - mineA.api_version);
      });

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
  var isSecure = isHTTPS(mine),
    mineNode = document.createElement("tr"),
    mineRow = "<td>" + mine.name + "</td>" +
    "<td>" + mine.api_version + "</td>"+
    "<td class='https " + isSecure + "'>" + isSecure + "</td>";
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
checks if a url starts with https or not
**/
function isHTTPS(mine) {
  var mineProtocol = mine.url.split("://")[0],
  result;
  if (mineProtocol == "https") {
    result = "Y";
  } else {
    result = "N";
  }
  return result;
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
  var header = "<th>Mine Name</th> <th>API version</th> <th>HTTPS?</th>"
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
 * Helper for the generateHeader function
 **/
function cellForHeaderField(fieldName) {
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
  var result = configs[mine][cell] ? "Y" : "N";
  elem.innerHTML = result;
  elem.setAttribute("class", result);
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
