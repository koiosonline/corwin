import { } from "./3box.js"; 
import { getUserAddress, getWeb3,authorize } from "./koios_web3.mjs";
import {DomList,LinkClickButton,subscribe,FitOneLine,getElement} from '../lib/koios_util.mjs';
import {log} from '../lib/koios_log.mjs'; 

let box;
let space;
let currentThread;
var GlobalForumentryList = new DomList("forumentry");
var GlobalThreadList = new DomList("threadentry");  
const Moderator="0xe88cAc4e10C4D316E0d52B82dd54f26ade3f0Bb2";
const KoiosSpace = "koiostestspace";

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
    space = await box.openSpace(KoiosSpace);
    WriteThread();
    //testbutton();
}

async function testbutton() {
    var target=getElement("testinput")    
    target.contentEditable="true"; // make div editable
    target.style.whiteSpace ="pre"; //werkt goed in combi met innerText
    
    console.log("link");
    LinkClickButton("testbutton");subscribe("testbuttonclick",Input);  
}

async function WriteThread() {
    FindSender(document.getElementsByClassName("myname"),box.DID)
    var target=getElement("testinput")    
    target.contentEditable="true"; // make div editable
    target.style.whiteSpace ="pre"; //werkt goed in combi met innerText
    LinkClickButton("testbutton");subscribe("testbuttonclick",Input);  

    currentThread = await space.joinThread("testthread", {
        firstModerator: Moderator,
        members: false
    });

    async function Input() {
        var target=getElement("testinput")    
        console.log(target.innerHTML);
        try {
            await currentThread.post(foruminput.innerHTML); 
          } catch (error) {
            console.log(error);
          }
    }  
    currentThread.onUpdate(async () => {
        var uposts = await currentThread.getPosts()
        await ShowPosts(uposts);
    })
    currentThread.onNewCapabilities((event, did) => console.log(did, event, ' the chat'))
    const posts = await currentThread.getPosts()
    await ShowPosts(posts);
}

/*
 * Show the posts in the interface
 */
async function ShowPosts(posts) {
    console.log(posts);
    for (var i=0;i<posts.length;i++) {        
        if (!document.getElementById(posts[i].postId) ){ // check if post is already shown
            var did=posts[i].author;           
            var date = new Date(posts[i].timestamp * 1000);
            console.log(`${i} ${posts[i].message} ${did} ${date.toString() }`)
            
            var target = GlobalForumentryList.AddListItem() // make new entry
            target.getElementsByClassName("forummessage")[0].innerHTML = posts[i].message            
            FitOneLine(target.getElementsByClassName("forummessage")[0])
            target.getElementsByClassName("forumtime")[0].innerHTML = date
            FitOneLine(target.getElementsByClassName("forumtime")[0])
            
            target.id = posts[i].postId                                        // remember which postId's we've shown
            FindSender (target.getElementsByClassName("forumsender")[0],did);  // show then profilename (asynchronous)  
            FitOneLine(target.getElementsByClassName("forumsender")[0])
            var deletebutton=target.getElementsByClassName("forumdelete")[0]
            SetDeleteButton(deletebutton,posts[i].postId)            
        }
    }
    
    var postdomids=document.getElementsByClassName("forumentry");
    //console.log(postdomids);
    for (var i=0;i<postdomids.length;i++) {
        
        var checkpostid=postdomids[i].id;
        console.log(`checkpostid=${checkpostid}`);
        var found=false;
        for (var j=0;j<posts.length;j++) {
            if (posts[j].postId == checkpostid) { found=true;break; }
        }
        if (!found)
            postdomids[i].style.textDecoration="line-through";   
    }   
}