// Variable created to hold a database connection
let db;

// Establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// If the db changes we will use the next event
// This event will emit if the database version changes
request.onupgradeneeded = function(event) {

    // Save a reference to the database
    const db = event.target.result;

    // Create an object store (table) called `new_transaction`, set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// When successful

request.onsuccess = function(event) {
   // When db is successfully created with its object store or simply established a connection, save reference to db in global variable
   db = event.target.result;

   // Check if app is online running the 'uploadTransaction function'
   if (navigator.onLine) {
       uploadTransaction();
   } 
};

request.onerror = function(event) {
    // Console error
    console.log(event.target.errorCode);
};

// Function executed if no internet connection
function saveRecord(record) {

    // Open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // Access the object store for `new_transaction`
    const  budgetObjectStore = transaction.objectStore('new_transaction');

    // Add record to your store with add method
    budgetObjectStore.add(record);
}

function uploadTransaction() {

    // Open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // Access to your object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // Get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {

        // Using if statement
        // If there was data in indexedDb's store send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    // Open one more transaction
                    const transaction = db.transaction(['new_transaction'], 'readwrite');

                    // Access the new_transaction object store
                    const budgetObjectStore = transaction.objectStore('new_transaction');

                    // Clear all items in your store
                    budgetObjectStore.clear();

                    alert('All saved transactions has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

// Coming back online
window.addEventListener('online', uploadTransaction);