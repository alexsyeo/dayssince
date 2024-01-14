import { initializeApp } from "firebase/app";
import { collection, addDoc, getFirestore, getDocs, deleteDoc, doc  } from "firebase/firestore";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { differenceInDays } from "date-fns";

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
const firebaseUiConfig = {
    signInSuccessUrl: 'https://alexsyeo.github.io/dayssince/',
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        GoogleAuthProvider.PROVIDER_ID,
    //   firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    //   firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    //   firebase.auth.GithubAuthProvider.PROVIDER_ID,
    //   firebase.auth.EmailAuthProvider.PROVIDER_ID,
    //   firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    //   firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
    ],
    // tosUrl and privacyPolicyUrl accept either url string or a callback
    // function.
    // Terms of service url/callback.
    // tosUrl: '<your-tos-url>',
    // Privacy policy url/callback.
    // privacyPolicyUrl: function() {
    //   window.location.assign('<your-privacy-policy-url>');
    // }
};

// Document elements
const mainElement = document.getElementById("main");
const itemsListElement = document.getElementById("itemsList");
const itemInputElement = document.getElementById("itemInput");
const datePickerElement = document.getElementById("datePicker");
const saveButtonElement = document.getElementById("saveButton");
const signOutButtonElement = document.getElementById('signOutButton');
const firebaseAuthUiElement = document.getElementById("firebaseui-auth-container");

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Functions
function extractYearMonthDay(date) {
    return date.split('-').map((item) => {
        return parseInt(item);
    });
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
    datePickerElement.value = "";
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
        
        var currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();
        currentDate = new Date(year, month, day);

        const daysDiff = differenceInDays(currentDate, item.date);
        itemElement.innerHTML = item.title + ": " + daysDiff + (daysDiff == 1 ? " day" : " days");
        itemElement.id = item.id;
        itemElement.onclick = () => {
            deleteItem(item.id);
            populateNewItem(item);
        }
        itemsListElement.appendChild(itemElement);
    }
}

function populateNewItem(item) {
    itemInputElement.value = item.title;
    datePickerElement.value = item.date.toISOString().split('T')[0];
}

function initApp() {
    const auth = getAuth();
    const firebaseUi = new firebaseui.auth.AuthUI(auth);

    saveButtonElement.addEventListener("click", saveItem);
    signOutButtonElement.addEventListener('click', function() {
        auth.signOut();
    });
    auth.onAuthStateChanged(async function(user) {
        if (user) {
            uid = user.uid;
            
            mainElement.style.display = "block";
            firebaseAuthUiElement.style.display = "none";

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
        } else {
            uid = null;

            firebaseAuthUiElement.style.display = "block";
            mainElement.style.display = "none";

            // The start method will wait until the DOM is loaded.
            firebaseUi.start('#firebaseui-auth-container', firebaseUiConfig);
            if (firebaseUi.isPendingRedirect()) {
                firebaseUi.start('#firebaseui-auth-container', firebaseUiConfig);
            }
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