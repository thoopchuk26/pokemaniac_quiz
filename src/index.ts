import {pokemon} from './Pokemon';
import {moves} from './Moves';

// const body = document.querySelector("body"),
// sidebar = body.querySelector(".sidebar"),
// toggle = body.querySelector(".toggle");

// toggle.addEventListener("click", () => {
//     sidebar.classList.toggle("close");
// });

const onReady = () => {
    const onSideBarClick = function (this: HTMLElement) {
        document.querySelector(".sidebar")!.classList.toggle("close");
    };

    document.querySelector('.toggle')!.addEventListener('click', onSideBarClick);
}

if (document.readyState !== 'loading') {
    onReady();
} else {
    document.addEventListener('DOMContentLoaded', onReady);
}