var fieldsToCheck = {
  webProperties : {
    prettyName : "Web Properties",
    url : "web-properties"
  }
}

//let's make the list of mines globally accessible
var mines, configs = {};


//get all InterMines as soon as the DOM has loaded
document.addEventListener("DOMContentLoaded", function() {
  $.ajax("http://registry.intermine.org/service/instances").then(function(response) {
    //storing mines globally
    mines = response.instances;

    var minesList = document.getElementById("interMinesList");

    var headerRow =  minesList.querySelector("thead tr");
    console.log(headerRow);

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

function mineNode(mine) {
  //Generate text for links to each mine.
  var mineNode = document.createElement("tr"),
    mineRow = "<td>" + mine.name + "</td>" +
    "<td>" + mine.api_version + "</td>" +
    "<td class='webProperties'>" + "loading config" + "</td>";
  mineNode.organisms = mine.organisms;
  mineNode.setAttribute("class", "mineEntry");
  mineNode.setAttribute("id", mine.namespace);
  mineNode.innerHTML = mineRow;
  return mineNode;
}

function fetchConfig(mine) {
  var thisMine = configs[mine.namespace] = {};
  Object.keys(fieldsToCheck).map(function(fieldName){
    var field = fieldsToCheck[fieldName];
    thisMine[fieldName] = $.ajax(mine.url + "/service/" + field.url);
    thisMine[fieldName].done(function(response) {
       thisMine[fieldName] = response;
        updateCell(mine.namespace, fieldName);
     });
     thisMine[fieldName].fail(function(response) {
        thisMine[fieldName] = false;
        updateCell(mine.namespace, fieldName);
     });
  });
}

function updateCell(mine, cell) {
  var elem = document.getElementById(mine).getElementsByClassName(cell)[0];
  elem.innerHTML = configs[mine][cell] ? "Y" : "N"
}

function generateHeader(){
  var header = "<th>Mine Name</th> <th>API version</th>"
  Object.keys(fieldsToCheck).map(function(field){
    header += "<th>" + fieldsToCheck[field].prettyName + "</th>";
  });
  return header;
}
