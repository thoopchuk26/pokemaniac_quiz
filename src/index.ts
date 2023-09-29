import {shuffle} from 'lodash';

import pokemon from '../src/Pokemon.json';
import moves from '../src/Moves.json';


const DIFFICULTY = {
    POKEBALL: 0,
    GREATBALL: 1,
    ULTRABALL: 2
} as const;

const QUIZTYPE = {
    ABILITY: 0,
    SPECIES: 1,
    SHINY: 2,
    STATVS: 3
} as const;

let stats: string[] = ["HP", "Attack", "Defense", "SpAtk", "SpDef", "Speed", "Total"];

type DifficultyKey = keyof typeof DIFFICULTY;
type Difficulty = typeof DIFFICULTY[DifficultyKey];

type QuizTypeKey = keyof typeof QUIZTYPE;
type QuizType = typeof QUIZTYPE[QuizTypeKey];

let currentQuizType:QuizType = QUIZTYPE.ABILITY as QuizType;
let currentDifficulty:Difficulty = DIFFICULTY.GREATBALL as Difficulty;

let maxPokemonID: number = pokemon[pokemon.length-1]['ID'];

let currentPokemonID: number[];
let currentPokemonImageUrl: string[];

let upcomingPokemon: number[];
let currentPokemonIndex: number;
let timeTaken: number = -1;
let streak: number = 0;
let best: number = 0;
let isTypeInput: boolean = true;

let question: HTMLElement;
let answer: string[];

let questionContent = {
    0 : ["What's a Pokemon that has the X ability?","What's an Ability this Pokemon has?","What's this Pokemon's Hidden Ability?"],
    1 : ["What's a Pokemon that is of the X Species?", "what's this Pokemon's Species?"],
    2 : ["Is this Shiny Pokemon's Sprite Correct?"],
    3 : ["Which Pokemon has the Larger Stat Total?", "Which Pokemon has the Higher X Stat?", "Which Pokemon has the Higher X Stat or are they the same?"],
    4 : ["Does this Pokemon learn X?"]
}

let elements: {
    canvas: HTMLCanvasElement;
    countdownToNextMessage: HTMLElement;
    dontKnowButton: HTMLElement;
    generationFinishedMessage: HTMLElement;
    input: HTMLInputElement;
    playArea: HTMLElement;
    settingsChangeMessage: HTMLElement;
    streakCount: HTMLElement;
    bestStreak: HTMLElement;
    nextQuestion: HTMLElement;
};

const onReady = () => {
    elements = {
        canvas: document.getElementById('shadowImage') as HTMLCanvasElement,
        countdownToNextMessage: document.getElementById('nextCountdown') as HTMLElement,
        dontKnowButton: document.getElementById('giveAnswer') as HTMLElement,
        generationFinishedMessage: document.getElementById('generationFinishedMessage') as HTMLElement,
        input: document.getElementById('guess') as HTMLInputElement,
        playArea: document.getElementById('playArea') as HTMLElement,
        settingsChangeMessage: document.getElementById('infoBoxMain') as HTMLElement,
        streakCount: document.getElementById('streakCount') as HTMLElement,
        bestStreak: document.getElementById('bestStreak') as HTMLElement,
        nextQuestion : document.getElementById('nextQuestion') as HTMLElement
    }

    const onSideBarClick = function (this: HTMLElement) {
        document.querySelector(".sidebar")!.classList.toggle("close");
    };
    document.querySelector('.toggle')!.addEventListener('click', onSideBarClick);

    const onQuizMenuClick = function (this: HTMLElement, ev: Event){
        ev.preventDefault();
        currentDifficulty = DIFFICULTY.GREATBALL;
        setQuizType(parseInt(this.getAttribute('quiz-type')!, 10) as QuizType);
    };
    document.querySelectorAll('.quizSelector').forEach(el => el.addEventListener('click', onQuizMenuClick));

    const onDiffMenuClick = function (this: HTMLElement, ev: Event){
        ev.preventDefault();
        setDifficulty(parseInt(this.getAttribute('data-difficulty')!, 10) as Difficulty);
    };
    document.querySelectorAll('.diffSelect').forEach(el => el.addEventListener('click', onDiffMenuClick));

    const onUnknownClick = function (this:HTMLElement) {
        streak = 0;
        waitingRoom();
    }
    document.querySelector('.dontKnow')!.addEventListener('click', onUnknownClick);

    const onAnswerButtonClick = function (this: HTMLElement, ev: Event){
        ev.preventDefault();
        checkAnswer("", parseInt(this.getAttribute('data-truth')!, 10) as number);
    };
    document.querySelectorAll('.button').forEach(el => el.addEventListener('click', onAnswerButtonClick));

    const onNextClick = function (this:HTMLElement) {
        setMenu();
        elements.nextQuestion.hidden = true;
        generateQuizContent();
    }
    document.querySelector('.next')!.addEventListener('click', onNextClick);

    
    elements.input.addEventListener('input', function (this: HTMLInputElement) {
        checkAnswer(this.value, -1);
    });

    question = document.querySelector('.question')!;
    generateRandomArray();
    generateQuizContent();
}

if (document.readyState !== 'loading') {
    onReady();
} else {
    document.addEventListener('DOMContentLoaded', onReady);
}

function generateQuizContent(){
    let isPair: boolean = false;
    let isRealShiny: boolean = true;
    elements.dontKnowButton.style.visibility = "visible";
    switch (currentQuizType){
        case QUIZTYPE.ABILITY:
            isTypeInput = true;
            generateSingleMonQuizData();
            let ability: string[] = [];
            if(currentDifficulty == DIFFICULTY.ULTRABALL){
                while(pokemon[currentPokemonID[0]-1].HiddenAbility == 'N/A'){
                    generateSingleMonQuizData();
                }
                ability = [pokemon[currentPokemonID[0]-1].HiddenAbility];
            }
            else if (pokemon[currentPokemonID[0]-1].HiddenAbility != 'N/A'){
                ability.push(pokemon[currentPokemonID[0]-1].HiddenAbility.toLowerCase());
            }
            pokemon[currentPokemonID[0]-1].Ability.toLowerCase().split(/[\s,]+/).forEach((e) => ability.push(e));
            currentPokemonImageUrl = ['images/sprites/front_default_sprite/' + currentPokemonID[0].toString() + '.png'];
            if(currentDifficulty == DIFFICULTY.POKEBALL){
                let abilityChoice = ability[Math.floor(Math.random()* ability.length)];
                let pokemonList: string[] = [];
                for(let i = 0; i < maxPokemonID; i++){
                    if(pokemon[i].Ability.includes(abilityChoice) || pokemon[i].HiddenAbility.includes(abilityChoice)){
                        pokemonList.push(pokemon[i].Name);
                    }
                }

                question.innerHTML = questionContent[currentQuizType][currentDifficulty];
                question.innerHTML = question.innerHTML.replace("X", abilityChoice);
                currentPokemonImageUrl = ['images/question_mark.png'];
                answer = pokemonList;
            }
            else{
                for(let i = 0; i < ability.length; i++){
                    ability[i] = ability[i].replace("-", " ");
                }
                answer = currentDifficulty == DIFFICULTY.GREATBALL ? ability : [ability[0]];
            }
            break;
        case QUIZTYPE.SHINY:
            isTypeInput = false;
            document.getElementById("trueButton")!.innerHTML = "True";
            document.getElementById("falseButton")!.innerHTML = "False";
            generateSingleMonQuizData();
            while (currentPokemonID[0] > 905){
                generateSingleMonQuizData();
            }
            let rand = Math.random();
            isRealShiny = rand >= 0.5;
            if(isRealShiny){
                currentPokemonImageUrl = ['images/sprites/shiny_front_default_sprite/' + currentPokemonID[0].toString() + '.png'];
            }
            else{
                currentPokemonImageUrl = ['images/sprites/front_default_sprite/' + currentPokemonID[0].toString() + '.png'];
            }
            answer = [isRealShiny.toString()];
            break;
        case QUIZTYPE.SPECIES:
            isTypeInput = true;
            generateSingleMonQuizData();
            if(currentDifficulty == DIFFICULTY.POKEBALL){
                let pokemonList: string[] = [];
                for(let i = 0; i < maxPokemonID; i++){
                    if(pokemon[i].Species.includes(pokemon[currentPokemonID[0]-1].Species)){
                        pokemonList.push(pokemon[i].Name);
                    }
                }
                question.innerHTML = questionContent[currentQuizType][currentDifficulty];
                question.innerHTML = question.innerHTML.replace("X", pokemon[currentPokemonID[0]-1].Species);
                currentPokemonImageUrl = ['images/question_mark.png'];
                answer = pokemonList;
            }
            else{
                currentPokemonImageUrl = ['images/sprites/front_default_sprite/' + currentPokemonID[0].toString() + '.png'];
                answer = [pokemon[currentPokemonID[0]-1].Species.toLowerCase().replace(' pokémon', '')];
            }
            break;
        case QUIZTYPE.STATVS:
            isTypeInput = false;
            if(currentDifficulty == DIFFICULTY.ULTRABALL){
                currentPokemonID = generatePokemonPair(0.1);
            }
            else{
                currentPokemonID = generatePokemonPair(0.2);
            }
            currentPokemonImageUrl = ['images/sprites/front_default_sprite/' + currentPokemonID[0].toString() + '.png', 'images/sprites/front_default_sprite/' + currentPokemonID[1].toString() + '.png'];
            isPair = true;
            document.getElementById("trueButton")!.innerHTML = pokemon[currentPokemonID[0]-1].Name;
            document.getElementById("falseButton")!.innerHTML = pokemon[currentPokemonID[1]-1].Name;
            break;
        default:
            break;
    }
    console.log(answer);
    displayPokemon(isRealShiny);
}

function generateSingleMonQuizData(){
    currentPokemonID = [upcomingPokemon[currentPokemonIndex]];
    currentPokemonIndex += 1;
    if (currentPokemonIndex >= maxPokemonID){
        generateRandomArray();
        currentPokemonIndex = 0;
    }
}

function generateRandomArray(){
    let array = Array.from(Array(maxPokemonID).keys());
    array[0] = 1010;
    upcomingPokemon = shuffle(array);
    currentPokemonIndex = 0;
}

function generatePokemonPair(range: number): number[]{
    let pokemonId = Math.floor(Math.random() * maxPokemonID);
    let pokemonPairId: number = -1;

    let statChoice: string;
    if(currentDifficulty == DIFFICULTY.POKEBALL){
        statChoice = stats[stats.length-1];
    }
    else{
        statChoice = stats[Math.floor(Math.random()*6)];
    }
    let pokemonStat: number = getPokemonStat(statChoice, pokemonId);
    let pokemonStatPair: number = 0;
    
    if(currentDifficulty == DIFFICULTY.ULTRABALL){
        while((pokemonStatPair < Math.floor(pokemonStat * (1-range)) || pokemonStatPair > Math.floor(pokemonStat * (1+range))) || pokemonPairId == pokemonId){
            pokemonPairId = Math.floor(Math.random() * maxPokemonID);
            pokemonStatPair = getPokemonStat(statChoice, pokemonPairId);
        }
    }
    else{
        while((pokemonStatPair < Math.floor(pokemonStat * (1-range)) || pokemonStatPair > Math.floor(pokemonStat * (1+range))) || pokemonPairId == pokemonId || pokemonStat == pokemonStatPair){
            pokemonPairId = Math.floor(Math.random() * maxPokemonID);
            pokemonStatPair = getPokemonStat(statChoice, pokemonPairId);
        }
    }
    
    question.innerHTML = questionContent[currentQuizType][currentDifficulty];
    question.innerHTML = question.innerHTML.replace("X", statChoice);

    if(pokemonStat == pokemonStatPair){
        answer = ["same"];
    }
    else{
        answer = pokemonStat > pokemonStatPair ? [pokemon[pokemonId].Name] : [pokemon[pokemonPairId].Name];
    }
    return [pokemonId+1, pokemonPairId+1];
}

function getPokemonStat(statChoice: string, pokemonId: number): number{
    let stat: number = 0;
    if (statChoice != "Total"){
        stat = pokemon[pokemonId][statChoice as keyof typeof pokemon[0]] as number;
    }
    else{
        stat = pokemon[pokemonId].HP+pokemon[pokemonId].Attack+pokemon[pokemonId].Defense+pokemon[pokemonId].SpAtk+pokemon[pokemonId].SpDef+pokemon[pokemonId].Speed;
    }
    
    return stat;
}

function setDifficulty(selectedDifficulty: Difficulty){
    if(selectedDifficulty != currentDifficulty){
        currentDifficulty = selectedDifficulty;
        question.innerHTML = questionContent[currentQuizType][currentDifficulty];
        if(currentDifficulty == DIFFICULTY.ULTRABALL && currentQuizType == QUIZTYPE.STATVS){
            document.getElementById("equalButton")!.hidden = false;
        }
        else{
            document.getElementById("equalButton")!.hidden = true;
        }
        generateQuizContent();
    }
}

function setQuizType(selectedQuiz: QuizType){
    currentQuizType = selectedQuiz;
    if(currentQuizType == QUIZTYPE.SHINY){
        question.innerHTML = questionContent[currentQuizType][0];
    }
    else{
        question.innerHTML = questionContent[currentQuizType][currentDifficulty];
    }
    setMenu();
    generateQuizContent();
}

function setMenu(){
    document.getElementById("diff0")!.hidden = false;
    document.getElementById("diff2")!.hidden = false;
    switch(currentQuizType){
        case QUIZTYPE.ABILITY:
            document.getElementById("trueButton")!.hidden = true;
            document.getElementById("falseButton")!.hidden = true;
            document.getElementById("equalButton")!.hidden = true;
            elements.input.hidden = false;
            break;
        case QUIZTYPE.SPECIES:
            document.getElementById("trueButton")!.hidden = true;
            document.getElementById("falseButton")!.hidden = true;
            document.getElementById("equalButton")!.hidden = true;
            document.getElementById("diff2")!.hidden = true;
            elements.input.hidden = false;
            break;
            
        case QUIZTYPE.SHINY:
            document.getElementById("trueButton")!.hidden = false;
            document.getElementById("falseButton")!.hidden = false;
            document.getElementById("equalButton")!.hidden = true;
            document.getElementById("diff0")!.hidden = true;
            document.getElementById("diff2")!.hidden = true;
            elements.input.hidden = true;
            break;
        case QUIZTYPE.STATVS:
            document.getElementById("trueButton")!.hidden = false;
            document.getElementById("falseButton")!.hidden = false;
            elements.input.hidden = true;
            if(currentDifficulty == DIFFICULTY.ULTRABALL){
                document.getElementById("equalButton")!.hidden = false;
            }
            break;
        default:
            break;
    }
}

function checkAnswer(input: string, buttonAnswer: number){
    if(answer.includes(input.toLowerCase())){
        increaseStreak();
    }

    if(currentQuizType == QUIZTYPE.STATVS){
        if(buttonAnswer == 2){
            if(answer[0] == "same"){
                increaseStreak();
            }
        }
        else{
            if(pokemon[currentPokemonID[buttonAnswer]-1].Name == answer[0]){
                increaseStreak();
            }
            else{
                streak = 0;
                waitingRoom();
             }
        }
    }

    if(currentQuizType == QUIZTYPE.SHINY){
        if(answer[0] == "true" && buttonAnswer == 0){
            increaseStreak();
        }
        else if(answer[0] == "false" && buttonAnswer == 1){
            increaseStreak();
        }
        else{
            streak = 0;
            waitingRoom();
        }
    }
}

function increaseStreak(){
    if (streak == best){
        best += 1;
    }
    streak += 1;
    waitingRoom();
}

function waitingRoom(){
    elements.input.value = "";
    elements.input.hidden = true;
    document.getElementById("trueButton")!.hidden = true;
    document.getElementById("falseButton")!.hidden = true;
    document.getElementById("equalButton")!.hidden = true;

    elements.dontKnowButton.style.visibility = "hidden";
    elements.nextQuestion.hidden = false;

    elements.bestStreak.innerHTML = best.toString();
    elements.streakCount.innerHTML = streak.toString();
}

function displayPokemon(isRealShiny: boolean){
    const canvas = <HTMLCanvasElement> document.getElementById("shadowImage");
    const ctx = canvas.getContext('2d', {willReadFrequently: true})!;

    let isPair = currentPokemonImageUrl.length == 2;
    loadImages(function(images){
        if(isPair){
            ctx.drawImage(images[0], 0, canvas.height/4, canvas.width/2, canvas.height/2);
            ctx.drawImage(images[1], canvas.width/2, canvas.height/4, canvas.width/2, canvas.height/2);
        }
        else{
            if(images[0].width <= 100) {
                canvas.width = images[0].width * 4;
                canvas.height = images[0].height * 4;
            } else {
                canvas.width = images[0].width;
                canvas.height = images[0].height;
            }
            
            ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height);

            if(!isRealShiny) {
                let rawImage = ctx.getImageData(0,0,canvas.width,canvas.height);
                let rgb = [0,1,2];
                let defaultColor = [0,1,2];
                while(rgb.toString() == defaultColor.toString()){
                    rgb = shuffle(rgb);
                }
                for (let i=0; i<rawImage.data.length;i+=4) {
                    if(rawImage.data[i+3] >= 50) {
                        let random = [rawImage.data[i+rgb[0]], rawImage.data[i+rgb[1]], rawImage.data[i+rgb[2]]]
                        rawImage.data[i] = random[0];
                        rawImage.data[i+1] = random[1];
                        rawImage.data[i+2] = random[2];
                        rawImage.data[i+3] = 255;
                    } else {
                        rawImage.data[i+3] = 0;
                    }
                }
                ctx.putImageData(rawImage,0,0);
            }
        }
    });
    ctx.reset();
}

function loadImages(callback: (arg0: { [id: number]: HTMLImageElement; }) => void){
    var loadedImages = 0;
    var numImages = currentPokemonImageUrl.length;
    let images: {[id: number] : HTMLImageElement} = {};
    for(let i = 0; i < numImages; i++){
        images[i] = new Image();
        images[i].onload = function() {
            if(++loadedImages >= numImages){
                callback(images)
            }
        };
        images[i].src = currentPokemonImageUrl[i];
    }
}