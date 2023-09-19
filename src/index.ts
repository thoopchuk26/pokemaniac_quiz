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
let currentQuizType:QuizType = QUIZTYPE.ABILITY;

let maxPokemonID: number = pokemon[pokemon.length-1]['ID'];

let currentPokemonID: number[];
let currentPokemonName: string;
let currentPokemonImageUrl: string | null;

let currentPairPokemonImageUrl: string[];

let upcomingPokemon: number[];
let currentPokemonIndex: number;
let timeTaken: number = -1;

let loadedImage: HTMLImageElement;

let preloadedDifficulty = -1;

const onReady = () => {
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
        generatePokemon(currentQuizType);
        displayPokemon();
    }
    document.querySelector('.dontKnow')!.addEventListener('click', onUnknownClick);

    generateRandomArray();
    generatePokemon(currentQuizType);
    displayPokemon();
}

if (document.readyState !== 'loading') {
    onReady();
} else {
    document.addEventListener('DOMContentLoaded', onReady);
}

function generatePokemon(quizType: QuizType){
    let pokemonId = upcomingPokemon[currentPokemonIndex];
    switch (quizType){
        case QUIZTYPE.ABILITY:
            generateSingleMonQuizData(pokemonId);
            currentPokemonImageUrl = 'images/sprites/front_default_sprite/' + pokemonId.toString() + '.png';
            break;
        case QUIZTYPE.SHINY:
            generateSingleMonQuizData(pokemonId);
            currentPokemonImageUrl = 'images/sprites/shiny_front_default_sprite/' + pokemonId.toString() + '.png';
            break;
        case QUIZTYPE.SPECIES:
            generateSingleMonQuizData(pokemonId);
            currentPokemonImageUrl = 'images/sprites/front_default_sprite/' + pokemonId.toString() + '.png';
            break;
        case QUIZTYPE.STATVS:
            currentPokemonID = generatePokemonPair();
            currentPairPokemonImageUrl = ['images/sprites/front_default_sprite/' + currentPokemonID[0].toString() + '.png', 'images/sprites/front_default_sprite/' + currentPokemonID[1].toString() + '.png'];
            break;
        default:
            break;
    }
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
    let statChoice = stats[Math.floor(Math.random()*7)];
    let pokemonStat: number = getPokemonStat(statChoice, pokemonId);
    let pokemonStatPair: number = 0;
    while(!(pokemonStatPair > Math.floor(pokemonStat * 0.85) && pokemonStatPair < Math.floor(pokemonStat * 1.15))){
        let pokemonPairId = Math.floor(Math.random() * maxPokemonID);
        pokemonStatPair = getPokemonStat(statChoice, pokemonPairId);
    }
    return [pokemonStat, pokemonStatPair];
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
    
}

function checkAnswer(input:string){
    pokemon[currentPokemonID[0]]
}

function displayPokemon(){
    let pokemonImage = document.getElementById("pokemonImage")! as HTMLImageElement;
    pokemonImage.src = currentPokemonImageUrl!;
}