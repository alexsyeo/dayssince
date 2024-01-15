import { initializeApp } from "firebase/app";
import { collection, addDoc, getFirestore, getDocs, deleteDoc, doc  } from "firebase/firestore";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { differenceInDays } from "date-fns";
import { DateTime } from "luxon";

// Fields
var uid;
var itemsList = [];
const firebaseConfig = {
    apiKey: "AIzaSyBY3rXHJhDDkTgI11UwgYm2l2ElFzb96_o",
    authDomain: "days-since-9294c.firebaseapp.com",
    projectId: "days-since-9294c",
    storageBucket: "days-since-9294c.appspot.com",
    messagingSenderId: "592625644130",
    appId: "1:592625644130:web:b83b4fdb4b1bf36ebb173b"
};

// Document elements
const mainElement = document.getElementById("main");
const itemsListElement = document.getElementById("itemsList");
const itemInputElement = document.getElementById("itemInput");
const datePickerElement = document.getElementById("datePicker");
const saveButtonElement = document.getElementById("saveButton");
const clearButtonElement = document.getElementById("clearButton");
const signOutButtonElement = document.getElementById('signOutButton');
const signInButtonElement = document.getElementById('signInButton');
const signInContainerElement = document.getElementById('signInContainer');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Functions
function extractYearMonthDay(date) {
    return date.split('-').map((item) => {
        return parseInt(item);
    });
}

function setDatePickerToToday() {
    datePickerElement.value = DateTime.now().toISODate();
}

async function saveItem() {
    if (itemInputElement.value == "" || datePickerElement.value == "") {
        return;
    }

    const yearMonthDay = extractYearMonthDay(datePickerElement.value);
    const date = new Date(yearMonthDay[0], yearMonthDay[1] - 1, yearMonthDay[2]);

    const item = {
        title: itemInputElement.value,
        date: date,
    };

    const docReference = await addDoc(collection(db, uid), item);
    item.id = docReference.id;
    itemsList.push(item);
    sortItemsListByDate();
    renderItems();
    itemInputElement.value = "";
    setDatePickerToToday();
    hideClearButton();
}

function deleteItem(idToDelete) {
    itemsList = itemsList.filter((item) => {
        return item.id != idToDelete;
    });
    deleteDoc(doc(db, uid, idToDelete));
    renderItems();
}

function renderItems() {
    itemsListElement.innerHTML = "";
    for (let i = 0; i < itemsList.length; i++) {
        const item = itemsList[i];
        const itemElement = document.createElement("li");
        const spanElement = document.createElement("span");
        itemElement.appendChild(spanElement);
        
        var currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();
        currentDate = new Date(year, month, day);

        const daysDiff = differenceInDays(currentDate, item.date);
        spanElement.innerHTML = item.title + ": " + daysDiff + (daysDiff == 1 ? " day" : " days");
        itemElement.id = item.id;
        spanElement.onclick = () => {
            deleteItem(item.id);
            populateNewItem(item);
        }
        itemsListElement.appendChild(itemElement);
    }
}

function populateNewItem(item) {
    itemInputElement.value = item.title;
    datePickerElement.value = item.date.toISOString().split('T')[0];
    showClearButton();
}

function showClearButton() {
    clearButtonElement.style.display = "block";
}

function hideClearButton() {
    clearButtonElement.style.display = "none";
}

function clearItemInput() {
    itemInputElement.value = "";
}

function initApp() {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    saveButtonElement.addEventListener("click", saveItem);
    clearButtonElement.addEventListener("click", function() {
        clearItemInput();
        setDatePickerToToday();
        hideClearButton();
    });
    signInButtonElement.addEventListener("click", function() {
        signInWithPopup(auth, provider);
    });
    signOutButtonElement.addEventListener("click", function() {
        auth.signOut();
    });
    auth.onAuthStateChanged(async function(user) {
        if (user) {
            uid = user.uid;
            
            mainElement.style.display = "block";
            signInContainerElement.style.display = "none";

            // Sanity check to avoid duplicates.
            itemsList = [];

            // Fetch data from Firestore
            const querySnapshot = await getDocs(collection(db, uid));
            querySnapshot.forEach((itemDoc) => {
                const itemData = itemDoc.data();
                itemsList.push({
                    id: itemDoc.id, title: itemData.title, date: itemData.date.toDate()
                })
            });
            sortItemsListByDate();
            renderItems();
            setDatePickerToToday();
        } else {
            uid = null;

            signInContainerElement.style.display = "block";
            mainElement.style.display = "none";
        }
    }, function(error) {
        console.log(error);
    });
}

function sortItemsListByDate() {
    itemsList.sort((a, b) => {
        return a.date - b.date;
    });
}

window.addEventListener('load', initApp);