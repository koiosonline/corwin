import { } from "./3box.js"; 
//import { getUserAddress, getWeb3,authorize } from "./koios_web3.mjs";
import {DomList,LinkClickButton,subscribe,FitOneLine,getElement} from '../lib/koios_util.mjs';
import {log} from '../lib/koios_log.mjs'; 

let box;
let space;
let currentThread;
var GlobalForumentryList = new DomList("forumentry");
var GlobalThreadList = new DomList("threadentry");  
const Moderator="0xe88cAc4e10C4D316E0d52B82dd54f26ade3f0Bb2";

window.onerror = async function(message, source, lineno, colno, error) {   // especially for ios
    console.log("In onerror");
    var str=`Error: ${message} ${source}, ${lineno}, ${colno}  `;
    if (error && error.stack) str = str.concat('\n').concat(error.stack);
    log(str);    
} 

window.addEventListener('DOMContentLoaded', asyncloaded);

async function asyncloaded() {
    testbutton();
}

async function testbutton() {
    var target=getElement("testinput")    
    target.contentEditable="true"; // make div editable
    target.style.whiteSpace ="pre"; //werkt goed in combi met innerText
    
    console.log("link");
        LinkClickButton("test");subscribe("testbuttonclick",Input);  
        
        function Input() {
            var target=getElement("testinput")    
            console.log(target.innerHTML);
     }  
}