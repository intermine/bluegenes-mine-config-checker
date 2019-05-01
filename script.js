//let's make the list of mines globally accessible
var mines;

//get all InterMines as soon as the DOM has loaded
document.addEventListener("DOMContentLoaded", function() {
  $.ajax("http://registry.intermine.org/service/instances").then(function(response) {
    //storing mines globally
    mines = response.instances;

    var minesList = document.getElementById("interMinesList");

    //debug. remove when done.
    console.log(mines);

    //once everything is loaded, display a list of mines to the user
    mines.map(function(mine) {
      try {
        minesList.append(mineNode(mine));
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
    "<td>" + "loading config" + "</td>";
  mineNode.organisms = mine.organisms;
  mineNode.setAttribute("class", "mineEntry");
  mineNode.innerHTML = mineRow;
  return mineNode;
}
