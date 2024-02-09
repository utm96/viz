let task_by_domain = {}
let task_automated_by_domain = {}

let sorted_domain = []
let total_task = 0;

let listColor = ['#FFFAFA',
  '#FFE4E1',
  '#ECCFCF',
  '#F7BFBE',
  '#F7BFBE',
  '#F08F90',
  '#FA8072',
  '#FF6961',
  '#F7665A',
  '#FF0000']
function preload() {
  /* read csv file */
  table = loadTable("./data/My_Data.csv", "csv",
    "header");


  // console.log(task_by_domain['Data & IT']);

}

// total_task = 0 ;
// task_column = table.getColumn('Tasks')
// for (let i = 0; i < task_column.length; i++ ) {
// 	total_task += task_column[i];
// }
//In version 2C, instead of calculating exactly the raios of all possibilities,
// we take a heuristic approach, and don't resplit if it's not bat (close to 1:1, square ratio).

let randomHue; //color matching... the key to everything!
let totalValue = 0; //the total values of all elements together, just to write % on square.
let numbers;
let nbItems;

function setup() {


  console.log(table);
  console.log(table.getRows());
  for (let i = 0; i < table.rows.length; i++) {
    // console.log(table.getRow(i).get('Domain'));
    // Tasks']);
    if (!task_by_domain.hasOwnProperty(table.getRow(i).get('Domain'))) {
      task_by_domain[table.getRow(i).get('Domain')] = 0;
      task_automated_by_domain[table.getRow(i).get('Domain')] = 0;
    }
    task_by_domain[table.getRow(i).get('Domain')] = Number(table.getRow(i).get('Tasks')) + task_by_domain[table.getRow(i).get('Domain')];
    task_automated_by_domain[table.getRow(i).get('Domain')] = Number(table.getRow(i).get('Tasks'))*Number(table.getRow(i).get('AI Impact').replace('%','')) + task_automated_by_domain[table.getRow(i).get('Domain')];

    total_task += Number(table.getRow(i).get('Tasks'));
  }

  
  for (var domain in task_by_domain) {
    sorted_domain.push([domain, task_by_domain[domain]/total_task, task_automated_by_domain[domain]/task_by_domain[domain]]);
  }

  sorted_domain.sort(function (a, b) {
    return  b[1] - a[1];
  });
  console.log(task_automated_by_domain)
  console.log(sorted_domain);


  colorMode(HSL, 100); //it's just nicer this way... you know...
  createCanvas(600, 600);
  //noLoop();
  smooth();
  // numbers = [0.17, 0.03, 0.2, 0.2, 0.3, 0.05, 0.05]
  nbItems = sorted_domain.length

  calculate(sorted_domain);
}

//MOUSE PRESS
// function mousePressed() {
//   setup();
// }

function drawRect(x1, y1, w1, h1, value,colorRect) {
  console.log(colorRect);
  // value
  let color =  listColor[value.length%10];
  console.log(color);
  fill(color);
  rect(x1, y1, w1, h1); 
  fill(1);
  textAlign(CENTER, CENTER);
  text(str(value) ,x1 + (w1 / 2) - 10, y1 + (h1 / 2) + 5);

  print("++++ totalValue = " + totalValue);
}

///   FIND GOOD SPLIT NUMBER - advantagous block aspect ratio.
function getPerfectSplitNumber(list_domain, blockW, blockH) {
  // This is where well'll need to calculate the possibilities
  // We'll need to calculate the average ratios of created blocks.
  // For now we just try with TWO for the sake of the new functionn...

  //Let's just split in either one or two to start...

  // print("blockW = "+blockW);
  //print("blockH = "+blockH);


  let valueA = list_domain[0][1]; //our biggest value
  let valueB = 0; //value B will correspond to the sum of all remmaining objects in array
  for (let i = 1; i < list_domain.length; i++) {
    valueB += list_domain[i][1];
  }

  let ratio = float(valueA) / float(valueB + valueA);

  let heightA, widthA;
  if (blockW >= blockH) {
    heightA = blockH;
    widthA = floor(blockW * ratio);
  } else {
    heightA = floor(blockH * ratio);
    widthA = blockW;
  }

  let ratioWH = float(widthA) / float(heightA);
  let ratioHW = float(heightA) / float(widthA);
  let diff;

  if (widthA >= heightA) { // Larger rect //ratio = largeur sur hauteur,
    //we should spit vertically...
    diff = 1 - ratioHW;
  } else { //taller rectangle ratio
    diff = 1 - ratioWH;
  }

  if ((diff > 0.5) && (list_domain.length >= 3)) { //this is a bit elongated (bigger than 2:1 ratio)
    print("======================--> 22222");
    return 2; //TEMPORARY !!!!
  } else { //it's a quite good ratio! we don't touch it OR, it's the last one, sorry, no choice.   
    print("======================--> 11111");
    return 1;
  }


}

///   Start the recursion
function calculate(list_domain) {
  totalValue = 0;

  for (let i = 0; i <= list_domain.length - 1; i++) {
    // print(totalValue + " + " + numbers[i] + " = ...");
    totalValue += list_domain[i][1]; //There's a problem here, the total is never accurate...
    // print("numbers = \n" + numbers);

  }

  //basic param for the sake of this prototype ...
  let blockW = width - 20;
  let blockH = height - 20;
  let refX = 10;
  let refY = 10;

  makeBlock(refX, refY, blockW, blockH, list_domain); //x,y,w,h
}

///   MAKE BLOCK
function makeBlock(refX, refY, blockW, blockH, list_domain) {


  let nbItemsInABlock = getPerfectSplitNumber(list_domain, blockW, blockH); //return the numbers of elements that should be taken for A block.

  let valueA = 0; //the biggest value
  let valueB = 0; //value B will correspond to the sum of all remmaining objects in array
  let numbersA = []; //in the loop, we'll populate these two out of our main array.
  let numbersB = [];
  let nameA;
  let nameB;
  let colorA;
  let colorB;

  // console.log("makeBlock" : +list_domain);
  for (let i = 0; i < list_domain.length; i++) {
    if (i < nbItemsInABlock) { //item has to be placed in A array...
      numbersA = append(numbersA, list_domain[i]);
      //numbersA[i] = numbers[i]; //we populate our new array of values, we'll send it recursivly...
      valueA += list_domain[i][1];
      nameA = list_domain[i][0];
      colorA = list_domain[i][2];
    } else {
      numbersB = append(numbersB, list_domain[i]);
      //numbersB[i-nbItemsInABlock] = numbers[i]; //we populate our new array of values, we'll send it recursivly...
      valueB += list_domain[i][1];
      nameB = list_domain[i][0];
      colorB = list_domain[i][2];
    }
  }
  let ratio = float(valueA) / float(valueB + valueA);

  print("ratio = " + ratio);
  print("A val = " + valueA);
  print("B val = " + valueB);
  //now we split the block in two according to the right ratio...

  /////////////// WE SET THE X, Y, WIDTH, AND HEIGHT VALUES FOR BOTH RECTANGLES.

  let xA, yA, heightA, widthA, xB, yB, heightB, widthB;
  if (blockW > blockH) { //si plus large que haut...
    //we split vertically; so height will stay the same...

    xA = refX;
    yA = refY; // we draw the square in top right corner, so same value.
    heightA = blockH;
    widthA = floor(blockW * ratio);

    xB = refX + widthA;
    yB = refY;
    heightB = blockH;
    widthB = blockW - widthA; //the remaining portion of the width...

  } else { //tall rectangle, we split horizontally.
    xA = refX;
    yA = refY; // we draw the square in top right corner, so same value.
    heightA = floor(blockH * ratio);
    widthA = blockW;

    xB = refX;
    yB = refY + heightA;
    heightB = blockH - heightA;
    widthB = blockW; //the remaining portion of the width...

  }



  if (numbersA.length >= 2) { //this mean there is still stuff in this arary...
    makeBlock(xA, yA, widthA, heightA, numbersA);
  } else {
    drawRect(xA, yA, widthA, heightA, nameA,colorA);
  }

  if (numbersB.length >= 2) { //this mean there is still stuff in this arary...
    makeBlock(xB, yB, widthB, heightB, numbersB);
  } else {
    drawRect(xB, yB, widthB, heightB, nameB,colorB);
  }


}