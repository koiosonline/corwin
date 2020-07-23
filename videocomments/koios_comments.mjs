import { } from "../forum/3box.js"; 
import { getUserAddress, getWeb3,authorize } from "../forum/koios_web3.mjs";
import {DomList,getElement} from '../lib/koiosf_util.mjs';
import {log} from '../lib/koiosf_log.mjs'; 

let box;
let space;
let currentThread;
var GlobalCommentList = new DomList("commententry");
const Moderator="0xe88cAc4e10C4D316E0d52B82dd54f26ade3f0Bb2";
const KoiosSpace = "koiostestspace2";
var dummyvideos = new Array("1.1 Testvideo", "1.2 Testvideo2", "1.3 Testvideo3");

window.onerror = async function(message, source, lineno, colno, error) {   // especially for ios
    console.log("In onerror");
    var str=`Error: ${message} ${source}, ${lineno}, ${colno}  `;
    if (error && error.stack) str = str.concat('\n').concat(error.stack);
    log(str);    
} 

window.addEventListener('DOMContentLoaded', asyncloaded);

async function asyncloaded() {
    await authorize()
    box = await Box.openBox(getUserAddress(), getWeb3().givenProvider);    
    await box.syncDone
    space = await box.openSpace(KoiosSpace);
    
    SetVideoTitle(getElement("titletext"));
    getElement("posttext").addEventListener('animatedclick',PostComment)
}

async function SetVideoTitle(target) {
    console.log(dummyvideos[0]);
    console.log("title: ", titletext.innerHTML);
    target.innerHTML = dummyvideos[0];
    
}

async function WriteThread(threadAddress) {
    FindSender(document.getElementsByClassName("myname"),box.DID)
    var target=getElement("testinput")    
    target.contentEditable="true"; // make div editable
    target.style.whiteSpace ="pre"; //werkt goed in combi met innerText
    //LinkClickButton("testbutton");subscribe("testbuttonclick",Input);  

    currentThread = await space.joinThreadByAddress(threadAddress);

    currentThread.onUpdate(async () => {
        var uposts = await currentThread.getPosts()
        await ShowPosts(uposts);
    })
    currentThread.onNewCapabilities((event, did) => console.log(did, event, ' the chat'))
    const posts = await currentThread.getPosts()
    console.log("posts: ", posts);
    await ShowPosts(posts);
}

async function PostComment() {
    var target=getElement("commenttext")    
    try {
        if (currentThread)
            await currentThread.post(target.innerHTML); 
      } catch (error) {
        console.log(error);
      }
}  