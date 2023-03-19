
// Options for Player Colors... these are in the same order as our sprite sheet
const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

//Misc Helpers
function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}
function getKeyString(x, y) {
    return `${x}x${y}`;
}
function createName() {
    const prefix = randomFromArray([
      "COOL",
      "SUPER",
      "HIP",
      "SMUG",
      "COOL",
      "SILKY",
      "GOOD",
      "SAFE",
      "DEAR",
      "DAMP",
      "WARM",
      "RICH",
      "LONG",
      "DARK",
      "SOFT",
      "BUFF",
      "DOPE",
    ]);
    const animal = randomFromArray([
      "BEAR",
      "DOG",
      "CAT",
      "FOX",
      "LAMB",
      "LION",
      "BOAR",
      "GOAT",
      "VOLE",
      "SEAL",
      "PUMA",
      "MULE",
      "BULL",
      "BIRD",
      "BUG",
    ]);
    return `${prefix} ${animal}`;
  }


(function () {

    let playerId;
    let playerRef;  // our firebase refs, to interact with firebase
    let players = {};  // local list of state, of where the players are on the oage
    let playerElements = {};  // list of references to the actual dom elements

    const gameContainer = document.querySelector(".game-container");

    function handleArrowPress(xChange=0, yChange=0) {
        const newX = players[playerId].x + xChange;
        const newY = players[playerId].y + yChange;
        if (true) {  // can I move
            // move to the next space
            players[playerId].x = newX
            players[playerId].y = newY
            if (xChange === 1) {
                players[playerId].direction = "right"
            }
            if (xChange === -1) {
                players[playerId].direction = "left"
            }

            // tell firebase the new changes
            playerRef.set(players[playerId])
        }
    }

    function initGame() {

        new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1))
        new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1))
        new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0))
        new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0))

        const allPlayersRef = firebase.database().ref(`players`);
        const allCoinsRef = firebase.database().ref(`coins`);

        allPlayersRef.on("value", (snapshot) => {
            // Fires whenever changes occurs
            players = snapshot.val() || {};

            Object.keys(players).forEach((key) => {
                const characterState = players[key];
                let el = playerElements[key];

                // Update the DOM
                el.querySelector(".Character_name").innerHTML = characterState.name;
                el.querySelector(".Character_coins").innerHTML = characterState.coins;
                el.setAttribute("data-color", characterState.color);
                el.setAttribute("data-direction", characterState.direction);

                const left = 16 * characterState.x + "px"; // grid size = 16
                const top = 16 * characterState.y - 4 + "px";
                el.style.transform = `translate3d(${left}, ${top}, 0)`;
            })

        });
        allPlayersRef.on("child_added", (snapshot) => {
            // Fires whenever a new node is added the tree
            const addedPlayer = snapshot.val();
            const characterElement = document.createElement("div");
            characterElement.classList.add("Character", "grid-cell");

            if (addedPlayer.id === playerId) {
                characterElement.classList.add("you");
            }

            characterElement.innerHTML = (`
                <div class="Character_shadow grid-cell"></div>
                <div class="Character_sprite grid-cell"></div>
                <div class="Character_name-container">
                    <span class="Character_name"></span>
                    <span class="Character_coins">0</span>
                </div>
                <div class="Character_you-arrow"></div>
            `);

            playerElements[addedPlayer.id] = characterElement;

            // Fill in some initial state
            characterElement.querySelector(".Character_name").innerHTML = addedPlayer.name;
            characterElement.querySelector(".Character_coins").innerHTML = addedPlayer.coins;
            characterElement.setAttribute("data-color", addedPlayer.color);
            characterElement.setAttribute("data-direction", addedPlayer.direction);
            
            const left = 16 * addedPlayer.x + "px"; // grid size = 16
            const top = 16 * addedPlayer.y - 4 + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;

            gameContainer.appendChild(characterElement)

        })

        allPlayersRef.on("child_removed", (snapshot) => {

        });
    }

    firebase.auth().onAuthStateChanged((user) => {
        console.log(user);

        if (user) {
            // You're logged in
            playerId = user.uid;
            playerRef = firebase.database().ref(`players/${playerId}`)

            const name = createName()

            playerRef.set({
                id: playerId,
                name,
                direction: "right",
                color: randomFromArray(playerColors),
                x: 3,
                y: 10,
                coins: 0,
            })

            // Remove me from Firebase when I disconnect
            playerRef.onDisconnect().remove();


            // Begin the game now that we are signed in
            initGame();

        } else {
            // Your logged out


        }
    })

    firebase.auth().signInAnonymously().catch((error) => {
        let errorCode = error.code;
        let errorMessage = error.message;
        // ...

        console.log(errorCode, errorMessage)
    })


})();