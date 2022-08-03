let db;

const request = indexedDB.open('budget_tracker', 1);
request.onupgradeneeded = function(event) {
    // reference to the db and creates a object store 
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// on a successful request check and see if the app is online and then read the db
request.onsuccess = function(event) {
    db = event.target.result;
    if (navigator.onLine) {
        checkDatabase();
    }
};


// if error log it 
request.onerror = function (event) {
    console.log("Uh oh" + event.target.errorCode);
};

// function to save and then submit a new record if there is no internet connection
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');

    budgetObjectStore.add(record);
};

// function to open transaction on db access the store and get all the records 
function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
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
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('new_transaction');
                budgetObjectStore.clear();
                alert('All the saved transactions have been submitted');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
}

// listens for the app to come back online
window.addEventListener('online', uploadTransaction);
