/* The game board should be 6 categories across, 5 question down, displayed in a table. 
Above this should be a header row with the name of each category.
At the start of the game, you should randomly pick 6 categories from the jService API. 
For each category, you should randomly select 5 questions for that category.
Initially, the board should show with ? on each spot on the board (on the real TV show, 
it shows dollar amount, but we won’t implement this).
When the user clicks on a clue ?, it should replace that with the question text.
When the user clicks on a visible question on the board, it should change to the answer 
(if they click on a visible answer, nothing should happen)
When the user clicks the “Restart” button at the bottom of the page, it should load new 
categories and questions.*/

// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CATEGORY = 5;

let categories = [];


/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
    let response = await axios.get(`http://jservice.io/api/categories?count=100`);
    let catIds = response.data.map(category => category.id);
    return _.sampleSize(catIds, NUM_CATEGORIES); // Lodash sample function
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    let response = await axios.get(`http://jservice.io/api/category?id=${catId}`);
    let category = response.data;
    let clues = _.sampleSize(category.clues, NUM_QUESTIONS_PER_CATEGORY).map(clue => ({
        question: clue.question,
        answer: clue.answer,
        showing: null
    }));

    return { title: category.title, clues: clues };
}



/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */



async function fillTable() {
    $("#jeopardy thead").empty();
    $("#jeopardy tbody").empty();

    let $tr = $("<tr>");
    for (let cat of categories) {
        $tr.append($("<th>").text(cat.title));
    }
    $("#jeopardy thead").append($tr);

    for (let clueIdx = 0; clueIdx < NUM_QUESTIONS_PER_CATEGORY; clueIdx++) {
        let $tr = $("<tr>");
        for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
            $tr.append($("<td>").attr("data-clue-id", `${catIdx}-${clueIdx}`).text("?"));
        }
        $("#jeopardy tbody").append($tr);
    }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    let $targt = $(evt.target);
    let [catId, clueId] = $targt.attr("data-clue-id").split("-");
    let clue = categories[catId].clues[clueId];

    if (!clue.showing) {
        clue.showing = "question";
        $targt.text(clue.question);
    } else if (clue.showing === "question") {
        clue.showing = "answer";
        $targt.text(clue.answer);
    }
}


/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    $("#loading").show();
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    $("#loading").hide();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    showLoadingView();

    let categoryIds = await getCategoryIds();
    categories = [];

    for (let catId of categoryIds) {
        categories.push(await getCategory(catId));
    }

    console.log(categoryIds); // Should be 6 categories.
    console.log(categories); // Should have 5 clues.

    await fillTable();
    hideLoadingView();
}


/** On click of start / restart button, set up game. */

$("#start").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

$(async function () {
    setupAndStart();
    $("#jeopardy").on("click", "td", handleClick);
  }
);