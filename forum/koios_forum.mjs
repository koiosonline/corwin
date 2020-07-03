// Test via: https://koios-final.webflow.io/test/forum

import { } from "./3box.js"; // from "https://unpkg.com/3box/dist/3box.js"; // prevent rate errors
//import { Resolver} from  "https://unpkg.com/did-resolver/lib/resolver.esm.js" 
import { /*initializeContract,*/ getUserAddress, getWeb3,authorize } from "./koios_web3.mjs";
//import { abi, address } from "./constants/forum_contract.js";
import {DomList,LinkClickButton,subscribe,FitOneLine,getElement} from '../lib/koios_util.mjs';
import {/*SetupLogWindow,*/log} from '../lib/koios_log.mjs'; 

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

window.addEventListener('DOMContentLoaded', asyncloaded);  // load  

/*
 * Enables authorization with Metamask/3Box, loads the space and shows the threads within the space in the user interface
 */
async function asyncloaded() {    
    //var testbutton = getElement("test");
    //testButton();

    const KoiosSpace="koiosonline";
    await authorize();
    box = await Box.openBox(getUserAddress(), getWeb3().givenProvider);    
    space = await box.openSpace(KoiosSpace);
    ReadSpace();
}

/*
 * Creates a new open thread, which everyone can join and post to.
 */
async function CreateOpenThread(threadName, firstModerator) {
  var newThread = await space.joinThread(threadName, {
    firstModerator: firstModerator,
    members: false
  });
  await ShowThreads(newThread);
  await WriteThread(newThread.address);
}

/*
 * Open an existing thread, shows the posts in that thread and enables posting to this thread.
 */
async function WriteThread(threadAddress) {
    FindSender(document.getElementsByClassName("myname"),box.DID)
    var foruminput = document.getElementsByClassName("foruminput");
    foruminput.contentEditable="true"; // make div editable
    LinkClickButton("send");subscribe("sendclick",Send);   
    currentThread = await space.joinThreadByAddress(threadAddress);

    async function Send() {
        console.log("Sending");
        var foruminput = document.getElementsByClassName("foruminput");
        console.log(foruminput.innerHTML);
        try {
          await currentThread.post(foruminput.innerHTML); // thread inherited from parent function
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
 * Updates the threads within the space and allows making new threads within the space
 */
async function ReadSpace() {

  var testinput = getElement("testinput");
  testinput.contentEditable="true";
  await UpdateSpace();
  var createnewthread = document.getElementsByClassName("threadaddinfo");
  createnewthread.contentEditable="true"; // make div editable
  LinkClickButton("threadadd");subscribe("threadaddclick",OpenThread);   

  async function OpenThread() {
      var foruminput = document.getElementsByClassName("threadaddinfo");
      console.log(foruminput.innerHTML);
      try {
        await CreateOpenThread(createnewthread.innerHTML, Moderator); // thread inherited from parent function
      } catch (error) {
        console.log(error);
      }
  }
}

/*
 * Update the space with all the subscribed threads
 */
async function UpdateSpace() {
  const threads = await space.subscribedThreads();
  GlobalThreadList.EmptyList();
  await ShowThreads(threads);
}

/*
 * Update the posts in the thread
 */
async function UpdateThread() {
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

/*
 * Show the threads in the interface
 */
async function ShowThreads(threads) {
  for (var i=0;i<threads.length;i++) {        
    var target = GlobalThreadList.AddListItem() // make new entry
    target.getElementsByClassName("threadname")[0].innerHTML = threads[i].name.substr(24);
    target.getElementsByClassName("firstmoderator")[0].innerHTML = threads[i].firstModerator;
    var deletebutton=target.getElementsByClassName("threaddelete")[0]
    var gotobutton=target.getElementsByClassName("threadgoto")[0]
    SetThreadDeleteButton(deletebutton, threads[i].address)
    SetGoToThreadButton(gotobutton, threads[i].address)      
  }
}    

/*
 * Add button to delete a thread
 */
function SetThreadDeleteButton(domid,threadid) { // in seperate function to remember state
    var id=`delete-${threadid}`
    domid.id=id
    LinkClickButton(id);subscribe(`${id}click`,DeleteThread); 
    
    function DeleteThread() {
      try {
        console.log(`Deleting thread ${threadid}`);
        space.unsubscribeThread(threadid);
      } catch (error) {
        console.log(error);
      }
    }
}

/*
 * Add button to open the thread and see posts within that thread
 */
function SetGoToThreadButton(domid,threadid) { // in seperate function to remember state
  var id=`goto-${threadid}`
  domid.id=id
  LinkClickButton(id);subscribe(`${id}click`,GoToThread); 
  
  function GoToThread() {
    try {
      GlobalForumentryList.EmptyList();
      WriteThread(threadid);
    } catch (error) {
      console.log(error);
    }
  }
}

/*
 * Add button to delete a post
 */
function SetDeleteButton(domid,postid) { // in seperate function to remember state
    var id=`delete-${postid}`
    domid.id=id
    LinkClickButton(id);subscribe(`${id}click`,DeleteForumEntry); 
    
    async function DeleteForumEntry() {
        console.log(currentThread);
        try {
          await currentThread.deletePost(postid);
          await UpdateThread();
        } catch (error) {
          console.log(error);
        }
    }
}    

/*
 * Add button to delete a post
 */
function SetTestButton(domid,testid) { // in seperate function to remember state
  // make div editable
  var id=`test-${testid}`
  domid.id=id
  LinkClickButton(id);subscribe(`${id}click`,TestStuff); 
  
  async function TestStuff() {
      try {
        await console.log("Dit is een test");
        await log("Dit is een log test");
        //var testinput = getElement("testinput");
        //console.log(testinput);
      } catch (error) {
        console.log(error);
      }
  }
}    

/*
 * Add 3id as name of the post sender
 */
async function FindSender (target,did) {
    var profile = await Box.getProfile(did);
    target.innerHTML = profile.name ? profile.name : did           
}

async function testButton() {
  var testinput = document.getElementsByClassName("testinput");
  testinput.contentEditable="true"; // make div editable
  LinkClickButton("test");subscribe("testclick",TestStuff);   
  currentThread = await space.joinThreadByAddress(threadAddress);

  async function TestStuff() {
    try {
      await console.log("Dit is een test");
      await log("Dit is een log test");
      //var testinput = getElement("testinput");
      //console.log(testinput);
    } catch (error) {
      console.log(error);
    }
  }
}