import isEqual from 'lodash/isEqual';
import noop from 'lodash/noop';
import range from 'lodash/range';
import shuffle from 'lodash/shuffle';


import {pokemon} from './Pokemon';
import {moves} from './Moves';

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

type DifficultyKey = keyof typeof DIFFICULTY;
type Difficulty = typeof DIFFICULTY[DifficultyKey];

type QuizTypeKey = keyof typeof QUIZTYPE;
type QuizType = typeof QUIZTYPE[QuizTypeKey];

let pendingDifficulty: Difficulty;
let currentQuizType:QuizType;

let maxPokemonID: number = pokemon[pokemon.length-1]['ID'];

let currentPokemonID: number;
let currentPokemonName: string;
let currentPokemonImageUrl: string | null;

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

    const onQuizMenuClick = function (this: HTMLElement){

    };
    document.querySelectorAll('.quizSelector').forEach(el => el.addEventListener('click', onQuizMenuClick));

    const onDiffMenuClick = function (this: HTMLElement){

    };
    document.querySelectorAll('.diffSelector').forEach(el => el.addEventListener('click', onDiffMenuClick));
}

if (document.readyState !== 'loading') {
    onReady();
} else {
    document.addEventListener('DOMContentLoaded', onReady);
}

function generatePokemon(){
    let pokemonId = upcomingPokemon[currentPokemonIndex];
    currentPokemonImageUrl = 'images/sprites/front_default_sprites/' + pokemonId.toString() + '.png';
    currentPokemonID = pokemonId;
    currentPokemonName = pokemon[pokemonId]['Name'];
    currentPokemonIndex += 1;
}

function generateRandomArray(isStatVs: boolean){
    let array = Array.from(Array(maxPokemonID).keys());
    upcomingPokemon = shuffle(array);
    currentPokemonID = 0;
}

function generatePokemonPair(statChoice: string): number[]{
    let pokemonId = Math.floor(Math.random() * maxPokemonID);
    let pokemonStat: number = getPokemonStat(statChoice, pokemonId);
    let pokemonStatPair: number = 0;
    while(!(pokemonStatPair > Math.floor(pokemonStat * 0.85) && pokemonStatPair < Math.floor(pokemonStat * 1.15))){
        let pokemonPairId = Math.floor(Math.random() * maxPokemonID);
        pokemonStatPair = getPokemonStat(statChoice, pokemonPairId);
    }
    return [pokemonStat, pokemonStatPair];
}

//Due to the way Pokemon.ts is set up this is the only way I can dynamically access the stat data
//Originally the Pokemon and Moves data was held in a sqlite DB but converting it to raw JSON was the easiest solution for me
//I didn't like writing it as much as you don't like reading it
function getPokemonStat(statChoice: string, pokemonId: number): number{
    let stat: number = 0;
    switch (statChoice){
        case "HP":
            stat = pokemon[pokemonId].HP;
            break;
        case "Attack":
            stat = pokemon[pokemonId].Attack;
            break;
        case "Defense":
            stat = pokemon[pokemonId].Defense;
            break;
        case "SpAtk":
            stat = pokemon[pokemonId].SpAtk;
            break;
        case "SpDef":
            stat = pokemon[pokemonId].SpDef;
            break;
        case "Speed":
            stat = pokemon[pokemonId].Speed;
            break;
        case "Total":
            stat = pokemon[pokemonId].HP+pokemon[pokemonId].Attack+pokemon[pokemonId].Defense+pokemon[pokemonId].SpAtk+pokemon[pokemonId].SpDef+pokemon[pokemonId].Speed;
            break;
        default:
            console.log("Function input undefined");
            break;
    }
    return stat;
}