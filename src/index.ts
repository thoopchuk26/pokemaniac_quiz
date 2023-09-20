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
let currentPokemonName: string;
let currentPokemonImageUrl: string[];

let upcomingPokemon: number[];
let currentPokemonIndex: number;
let timeTaken: number = -1;

let loadedImage: HTMLImageElement;
let question: HTMLElement;
let answer: string[];

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
    let pokemonId = upcomingPokemon[currentPokemonIndex];
    let isPair: boolean = false;
    switch (currentQuizType){
        case QUIZTYPE.ABILITY:
            generateSingleMonQuizData(pokemonId);
            currentPokemonImageUrl = ['images/sprites/front_default_sprite/' + pokemonId.toString() + '.png'];
            let temp = pokemon[currentPokemonID[0]].Ability.toLowerCase().split(/[\s,]+/);
            if(pokemon[currentPokemonID[0]].HiddenAbility != 'N/A'){
                temp.push(pokemon[currentPokemonID[0]].HiddenAbility.toLowerCase());
            }
            for(let i = 0; i < temp.length; i++){
                temp[i] = temp[i].replace("-", " ");
            }
            answer = temp;
            break;
        case QUIZTYPE.SHINY:
            generateSingleMonQuizData(pokemonId);
            while (currentPokemonID[currentPokemonIndex] > 905){
                generateSingleMonQuizData(pokemonId);
            }
            currentPokemonImageUrl = ['images/sprites/shiny_front_default_sprite/' + pokemonId.toString() + '.png'];
            answer = ["true"];
            break;
        case QUIZTYPE.SPECIES:
            generateSingleMonQuizData(pokemonId);
            currentPokemonImageUrl = ['images/sprites/front_default_sprite/' + pokemonId.toString() + '.png'];
            answer = [pokemon[currentPokemonID[0]].Species.toLowerCase()];
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
    displayPokemon(isPair);
}

function generateSingleMonQuizData(pokemonId: number){
    currentPokemonID = [pokemonId];
    currentPokemonName = pokemon[pokemonId].Name;
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
    let pokemonId = Math.floor(Math.random() * maxPokemonID);
    let pokemonPairId: number = -1;

    let statChoice = stats[Math.floor(Math.random()*7)];
    let pokemonStat: number = getPokemonStat(statChoice, pokemonId);
    let pokemonStatPair: number = 0;

    while((pokemonStatPair < Math.floor(pokemonStat * 0.85) || pokemonStatPair > Math.floor(pokemonStat * 1.15)) && pokemonPairId != pokemonId){
        pokemonPairId = Math.floor(Math.random() * maxPokemonID);
        pokemonStatPair = getPokemonStat(statChoice, pokemonPairId);
    }
    
    question.innerHTML = questionContent[currentQuizType];
    question.innerHTML = question.innerHTML.replace("X", statChoice);
    answer = pokemonStat > pokemonStatPair ? [pokemon[pokemonId].Name] : [pokemon[pokemonPairId].Name];
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

function displayPokemon(isPair: boolean){
    let pokemonImage = document.getElementById("pokemonImage")! as HTMLImageElement;
    let pokemonImagePair = document.getElementById("pokemonImagePair")! as HTMLImageElement;
    if(isPair){
        pokemonImagePair.hidden = false;
        pokemonImage.src = currentPokemonImageUrl[0];
        pokemonImagePair.src = currentPokemonImageUrl[1];
    }
    else{
        pokemonImagePair.hidden = true;
        pokemonImage.src = currentPokemonImageUrl[0];
    }
    
}