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
const ThreadNameForTest= "/orbitdb/zdpuAskcBtYNnpi2ZscLhL7pEQmzRscH5eSBLyConFYB6AP29/3box.thread.koiostestspace.testthread";

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
    UpdateSpace();
    ReadSpace();
    UpdateTestButtons();
}

async function UpdateTestButtons() {
  LinkClickButton("updatethreads");subscribe("updatethreadsclick",UpdateT);
  LinkClickButton("updateposts");subscribe("updatepostsclick",UpdateP);

  async function UpdateT() {
      try {
          UpdateSpace();
      } catch (error) {
          console.log(error);
      }
  }

  async function UpdateP() {
    try {
        UpdatePosts();
    } catch (error) {
        console.log(error);
    }
}
}

/*
 * Creates a new open thread, which everyone can join and post to.
 */
async function CreateOpenThread(threadName, firstModerator) {
    var newThread = await space.joinThread(threadName, {
        firstModerator: firstModerator,
        members: false
    });
    console.log("new thread: ", newThread);
    await space.subscribeThread(newThread.address, {
      name: threadName,
      firstModerator: firstModerator,
      members: false
    });
    WriteThread(newThread.address);
    var dummypost = await newThread.post("dummypost");
    await newThread.deletePost(dummypost);
}

async function ReadSpace() {
    var createnewthread = getElement("threadaddinfo");
    createnewthread.contentEditable="true"; // make div editable
    createnewthread.style.whiteSpace ="pre";
    LinkClickButton("threadadd");subscribe("threadaddclick",OpenThread);

    async function OpenThread() {
        var newthread = getElement("threadaddinfo");
        console.log(newthread.innerHTML);
        try {
            CreateOpenThread(newthread.innerHTML, Moderator); // thread inherited from parent function
            console.log(space);
            await UpdateSpace();
        } catch (error) {
            console.log(error);
        }
    }
}

async function UpdateSpace() {
  GlobalThreadList.EmptyList();
  const threads = await space.subscribedThreads();
  console.log(threads);
  await ShowThreads(threads);
}

async function UpdatePosts() {
  var posts = await currentThread.getPosts()
  await ShowPosts(posts);
}

async function WriteThread(threadAddress) {
    FindSender(document.getElementsByClassName("myname"),box.DID)
    var target=getElement("testinput")    
    target.contentEditable="true"; // make div editable
    target.style.whiteSpace ="pre"; //werkt goed in combi met innerText
    LinkClickButton("testbutton");subscribe("testbuttonclick",Input);  

    currentThread = await space.joinThreadByAddress(threadAddress);

    async function Input() {
        var target=getElement("testinput")    
        console.log(target.innerHTML);
        try {
            await currentThread.post(target.innerHTML); 
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
            target.getElementsByClassName("forummessagetext")[0].innerHTML = posts[i].message            
            FitOneLine(target.getElementsByClassName("forummessagetext")[0])
            target.getElementsByClassName("forumtimetext")[0].innerHTML = date
            FitOneLine(target.getElementsByClassName("forumtimetext")[0])
            
            target.id = posts[i].postId                                        // remember which postId's we've shown
            FindSender (target.getElementsByClassName("forumsendertext")[0],did);  // show then profilename (asynchronous)  
            FitOneLine(target.getElementsByClassName("forumsendertext")[0])
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
 * Add button to delete a post
 */
async function SetDeleteButton(domid,postid) { // in seperate function to remember state
    var id=`delete-${postid}`
    domid.id=id
    LinkClickButton(id);subscribe(`${id}click`,DeleteForumEntry); 
    
    async function DeleteForumEntry() {
        console.log(currentThread);
        try {
          await currentThread.deletePost(postid);
          UpdatePosts();
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

/*
 * Show the threads in the interface
 */
async function ShowThreads(threads) {
  //GlobalThreadList.EmptyList();
    for (var i=0;i<threads.length;i++) {        
      var target = GlobalThreadList.AddListItem() // make new entry
      console.log("threaddata: ", threads[i]);
      target.getElementsByClassName("threadnametext")[0].innerHTML = threads[i].name;
      //target.getElementsByClassName("firstmoderator")[0].innerHTML = threads[i].firstModerator;
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