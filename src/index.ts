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

let pendingDifficulty: Difficulty;
let currentQuizType:QuizType = QUIZTYPE.ABILITY as QuizType;

let maxPokemonID: number = pokemon[pokemon.length-1]['ID'];

let currentPokemonID: number[];
let currentPokemonImageUrl: string[];

let upcomingPokemon: number[];
let currentPokemonIndex: number;
let timeTaken: number = -1;

let question: HTMLElement;
let answer: string[];
let loadedImage: HTMLImageElement;
let imagePair: HTMLImageElement;

let questionContent: string[] = 
["What's an Ability this Pokemon has?", 
"What's that Pokemon's Species?",
"Is this Pokemon's Shiny Sprite Correct?",
"Which Pokemon has the Higher X Stat"];

let elements: {
    canvas: HTMLCanvasElement;
    countdownToNextMessage: HTMLElement;
    dontKnowButton: HTMLElement;
    generationFinishedMessage: HTMLElement;
    input: HTMLInputElement;
    playArea: HTMLElement;
    settingsChangeMessage: HTMLElement;
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
    }

    const onSideBarClick = function (this: HTMLElement) {
        document.querySelector(".sidebar")!.classList.toggle("close");
    };
    document.querySelector('.toggle')!.addEventListener('click', onSideBarClick);

    const onQuizMenuClick = function (this: HTMLElement, ev: Event){
        ev.preventDefault();
        setQuizType(parseInt(this.getAttribute('quiz-type')!, 10) as QuizType);
    };
    document.querySelectorAll('.quizSelector').forEach(el => el.addEventListener('click', onQuizMenuClick));

    const onDiffMenuClick = function (this: HTMLElement, ev: Event){
        ev.preventDefault();
        setDifficulty(parseInt(this.getAttribute('data-difficulty')!, 10) as Difficulty);
    };
    document.querySelectorAll('.diffSelector').forEach(el => el.addEventListener('click', onDiffMenuClick));

    const onUnknownClick = function (this:HTMLElement) {
        generatePokemon();
    }
    document.querySelector('.dontKnow')!.addEventListener('click', onUnknownClick);

    
    elements.input.addEventListener('input', function (this: HTMLInputElement) {
        checkAnswer(this.value);
    });

    question = document.querySelector('.question')!;
    generateRandomArray();
    generatePokemon();
}

if (document.readyState !== 'loading') {
    onReady();
} else {
    document.addEventListener('DOMContentLoaded', onReady);
}

function generatePokemon(){
    elements.input.hidden = false;
    elements.dontKnowButton.innerHTML = "I Don't Know";
    let isPair: boolean = false;
    let isRealShiny: boolean = true;
    switch (currentQuizType){
        case QUIZTYPE.ABILITY:
            generateSingleMonQuizData();
            currentPokemonImageUrl = ['images/sprites/front_default_sprite/' + currentPokemonID[0].toString() + '.png'];
            let temp = pokemon[currentPokemonID[0]-1].Ability.toLowerCase().split(/[\s,]+/);
            if(pokemon[currentPokemonID[0]-1].HiddenAbility != 'N/A'){
                temp.push(pokemon[currentPokemonID[0]-1].HiddenAbility.toLowerCase());
            }
            for(let i = 0; i < temp.length; i++){
                temp[i] = temp[i].replace("-", " ");
            }
            answer = temp;
            break;
        case QUIZTYPE.SHINY:
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
            generateSingleMonQuizData();
            currentPokemonImageUrl = ['images/sprites/front_default_sprite/' + currentPokemonID[0].toString() + '.png'];
            answer = [pokemon[currentPokemonID[0]-1].Species.toLowerCase()];
            break;
        case QUIZTYPE.STATVS:
            currentPokemonID = generatePokemonPair();
            currentPokemonImageUrl = ['images/sprites/front_default_sprite/' + currentPokemonID[0].toString() + '.png', 'images/sprites/front_default_sprite/' + currentPokemonID[1].toString() + '.png'];
            isPair = true;
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

function generatePokemonPair(): number[]{
    let pokemonId = Math.floor(Math.random() * maxPokemonID) + 1;
    let pokemonPairId: number = -1;

    let statChoice = stats[Math.floor(Math.random()*7)];
    let pokemonStat: number = getPokemonStat(statChoice, pokemonId);
    let pokemonStatPair: number = 0;

    while((pokemonStatPair < Math.floor(pokemonStat * 0.85) || pokemonStatPair > Math.floor(pokemonStat * 1.15)) && pokemonPairId != pokemonId){
        pokemonPairId = Math.floor(Math.random() * maxPokemonID) + 1;
        pokemonStatPair = getPokemonStat(statChoice, pokemonPairId);
    }
    
    question.innerHTML = questionContent[currentQuizType];
    question.innerHTML = question.innerHTML.replace("X", statChoice);
    answer = pokemonStat > pokemonStatPair ? [pokemon[pokemonId-1].Name] : [pokemon[pokemonPairId-1].Name];
    return [pokemonId, pokemonPairId];
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

}

function setQuizType(selectedQuiz: QuizType){
    if(selectedQuiz == QUIZTYPE.STATVS && currentQuizType != QUIZTYPE.STATVS){
        document.querySelector(".imageContainer")!.classList.toggle("solo");
    }
    else if(selectedQuiz != QUIZTYPE.STATVS && currentQuizType == QUIZTYPE.STATVS){
        document.querySelector(".imageContainer")!.classList.toggle("solo");
    }
    currentQuizType = selectedQuiz;
    question.innerHTML = questionContent[currentQuizType];
    generatePokemon();
}

function checkAnswer(input:string){
    if(answer.includes(input.toLowerCase())){
        console.log("correct");
        elements.input.value = "";
        elements.input.hidden = true;
        elements.dontKnowButton.innerHTML = "Next Question";
    }
    else{
        console.log("incorrect");
    }
}

//dynamic sillouhette function used from https://github.com/Menardi/whosthatpokemon/
function displayPokemon(isRealShiny: boolean){
    const canvas = <HTMLCanvasElement> document.getElementById("shadowImage");
    const ctx = canvas.getContext('2d', {willReadFrequently: true})!;

    let isPair = currentPokemonImageUrl.length == 2;
    if(isPair){
        loadImages(function(images){
            ctx.drawImage(images[0], 0, canvas.height/4, canvas.width/2, canvas.height/2);
            ctx.drawImage(images[1], canvas.width/2, canvas.height/4, canvas.width/2, canvas.height/2);
        });
        ctx.reset();
    }
    else{
        loadedImage = new Image();
        loadedImage.src = currentPokemonImageUrl[0];
        
        loadedImage.onload = function(){
            if(loadedImage.width <= 100) {
                canvas.width = loadedImage.width * 4;
                canvas.height = loadedImage.height * 4;
            } else {
                canvas.width = loadedImage.width;
                canvas.height = loadedImage.height;
            }
            
            ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);

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
}