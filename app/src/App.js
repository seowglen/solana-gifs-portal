import React, { useEffect, useState } from 'react';
import './App.css';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import idl from './idl.json';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

// CONSTANTS: 

const { SystemProgram, Keypair } = web3;
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');
const opts = {
  preflightCommitment: "processed"
}
const toastParams = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
}

const App = () => {
  /*              STATE               */

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [gifList, setGifList] = useState([]);
  const [hoveredGifIndex, setHoveredGifIndex] = useState(0);

  /*              ACTIONS             */
  
  const notify_success = (message) => {
    toast.success(message, toastParams);
  }

  const notify_error = (message) => {
    toast.error(message, toastParams);
  }

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const renderModal = () => {
    let modal = document.getElementById("myModal");
    modal.style.display = "block";
  }

  const renderCloseModalOnClick = () => {
    let modal = document.getElementById("myModal");
    modal.style.display = "none";
  }

  window.onclick = function(event) {
    let modal = document.getElementById("myModal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
    if (event.target === document.getElementsByClassName("modal-image-left")[0]) {
      modal.style.display = "none";
    }
    if (event.target === document.getElementsByClassName("modal-image-right")[0]) {
      modal.style.display = "none";
    }
  }

  const handleLeftClick = (index) => {
    setHoveredGifIndex(index - 1);
  }

  const handleRightClick = (index) => {
    setHoveredGifIndex(index + 1);
  }

  const handleTextareaChange = (e) => {
    setTextareaValue(e.target.value);
  }

  const renderNotConnectedContainer = () => (
    <div className="disconnected-container">
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect to Wallet
      </button>
    </div>
  );

  const renderConnectedContainer = () => {
    return (
      <div className="connected-container">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input
            type="text"
            placeholder="Submit a GIF link to the portal!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button type="submit" className="cta-button submit-gif-button">Submit</button>
        </form>
        <div className="gif-grid">
          {gifList.map((item, index) => (
            <div 
              className="gif-item" 
              key={index} 
              onClick={() => renderModal()} 
              onMouseEnter={() => setHoveredGifIndex(index)}
            >
              {item.account.tips.toNumber() > 0 && 
                <div className="tip-showcase">👑</div>
              }
              <img src={item.account.gifLink} alt={item.account.gifLink} />
              <div className="gif-description">
                <div className="text">🤍 {item.account.likes.length}</div>
                <div className="text">💬 {item.account.comments.length}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    )
  };

  /*             APIs                    */

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          const response = await solana.connect({ onlyIfTrusted: true });
          setWalletAddress(response.publicKey);
        }
      } else {
        notify_error('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
  
    if (solana) {
      const response = await solana.connect();
      notify_success(
        'Connected: ' 
        + response.publicKey.toString().slice(0, 5) 
        + '...' 
        + response.publicKey.toString().slice(response.publicKey.toString().length-5)
      );
      setWalletAddress(response.publicKey);
    } else {
      notify_error('Solana object not found! Get a Phantom Wallet 👻');
    }
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const sendGif = async () => {
    if (inputValue.length === 0) {
      notify_error("No GIF Link given!");
      return
    }
    const regex = new RegExp('^https?://(?:[a-z0-9\-]+\.)+[a-z]{2,6}(?:/[^/#?]+)+\.(?:gif)$');
    if (!regex.test(inputValue)) {
      notify_error("Please enter a valid GIF link!");
      notify_error("You can get some GIF link examples from GIPHY");
      setInputValue('');
      return;
    }
    setInputValue('');
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const gifKeypair = Keypair.generate();

      await program.rpc.addGif(inputValue, {
        accounts: {
          gif: gifKeypair.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [gifKeypair],
      });

      const account = await program.account.gif.fetch(gifKeypair.publicKey);
      setGifList(gifList => [
        {
          publicKey: gifKeypair.publicKey,
          account: account,
        },
        ...gifList, 
      ]);

      notify_success("Success added GIF to the portal!");
    } catch (error) {
      notify_error("Error sending GIF:" + error.message);
      console.log("Error sending GIF:", error);
    }
  };

  const likeGif = async (index, account) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.likeGif({
        accounts: {
          gif: account.publicKey,
          user: provider.wallet.publicKey,
        },
        signers: [],
      });

      const newAccount = await program.account.gif.fetch(account.publicKey);
      let copy = [...gifList];
      copy[index].account = newAccount;
      setGifList(copy);

      notify_success("Successfully liked GIF!");
    } catch (error) {
      notify_error("Error liking GIF:" + error.message);
      console.log("Error liking GIF: ", error.message);
    }
  }

  const tipGif = async (index, account) => {
    if (account.account.user.toString() === walletAddress.toString()) return;

    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.tipGif({
        accounts: {
          gif: account.publicKey,
          from: provider.wallet.publicKey,
          to: account.account.user,
          systemProgram: SystemProgram.programId,
        },
        signers: [],
      });

      const newAccount = await program.account.gif.fetch(account.publicKey);
      let copy = [...gifList];
      copy[index].account = newAccount;
      setGifList(copy);

      notify_success("Successfully tipped GIF!");
    } catch (error) {
      notify_error("Error tipping GIF: " + error.message);
      console.log("Error tipping GIF: ", error.message);
    }
  }

  const handleCommentSubmit = async (index, account) => {
    const comment = textareaValue;
    setTextareaValue('');
    const trimmedComment = comment.trim();
    if (!trimmedComment) return;

    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.commentGif(trimmedComment, {
        accounts: {
          gif: account.publicKey,
          user: provider.wallet.publicKey,
        },
        signers: [],
      });
      
      const newAccount = await program.account.gif.fetch(account.publicKey);
      let copy = [...gifList];
      copy[index].account = newAccount;
      setGifList(copy);

      notify_success("Successfully commented on GIF!");
    } catch (error) {
      notify_error("Error commenting on GIF: " + error.message);
      console.log("Error commenting GIF: ", error.message);
    }
  }

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const accounts = await program.account.gif.all();
      setGifList(accounts);   
    } catch (error) {
      notify_error("Error getting all GIFs: " + error.message);
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }

  /*              useEffects             */

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <ToastContainer />
      <div className={walletAddress ? 'authed-container' : 'container'}>
        {walletAddress && gifList.length > 0 &&
          <div id="myModal" className="modal">
            <div className="modal-divs">
              <div className="modal-image-left">
                <div className="left-button-background">
                  {hoveredGifIndex > 0 && 
                    <span className="left-button" onClick={() => handleLeftClick(hoveredGifIndex)}>&lt;</span>
                  }
                </div>
              </div>
              <div className="modal-content-container">            
                <div className="modal-content">
                  <span className="close" onClick={() => renderCloseModalOnClick()}>&times;</span>
                  <div className="modal-items">
                    <div className="modal-image-container">
                      <img 
                        className="modal-image" 
                        src={gifList[hoveredGifIndex].account.gifLink} 
                        alt={gifList[hoveredGifIndex].account.gifLink}
                      ></img>
                    </div>
                    <div className="modal-actions-container">
                      <div className="title-container">
                        <div className="title">GIF by: <strong>{
                          gifList[hoveredGifIndex].account.user.toString().slice(0, 4) 
                          + '...' 
                          + gifList[hoveredGifIndex].account.user.toString().slice(gifList[hoveredGifIndex].account.user.toString().length - 4,)
                          + ' '
                        }</strong> 
                        ({dayjs.unix(gifList[hoveredGifIndex].account.timestamp.toString()).format('lll')})
                        </div>
                      </div>
                      <div className="comments-container">
                        {gifList[hoveredGifIndex].account.comments.map(comment => (
                          <div className="single-comment-container">
                            <div className="single-comment">
                              <div className="single-comment-wallet-addr">{
                                comment.user.toString().slice(0, 4) 
                                + '...' 
                                + comment.user.toString().slice(comment.user.toString().length - 4,)
                              }</div>
                              {": " + comment.comment} 
                            </div>
                            <div className="comment-timestamp">
                              {dayjs.unix(comment.timestamp.toString()).fromNow()}
                            </div>
                          </div>
                        )).reverse()}
                      </div>
                      <div className="operations-container">
                        <div className="like-and-tips-container">
                          <div className="like-and-tips-operations">
                            <div className="like-and-comment-container">
                              <div className="like-container" onClick={() => likeGif(hoveredGifIndex, gifList[hoveredGifIndex])}>
                                {gifList[hoveredGifIndex].account.likes.some(e => e.toString() === walletAddress.toString()) ? (
                                  <div className="like">❤️</div>
                                ) : (
                                  <div className="like">🤍</div>
                                )}
                              </div>
                              <div className="comment-container" onClick={
                                () => document.getElementsByClassName("textarea")[0].focus()
                              }>
                                <div className="comment">💬</div>
                              </div>
                            </div>
                            <div className="tip-container" onClick={() => tipGif(hoveredGifIndex, gifList[hoveredGifIndex])}>
                              <div className="tip">{gifList[hoveredGifIndex].account.tips.toNumber()} 👑</div>
                            </div>
                          </div>
                          <div className="like-and-tips-number">
                            {gifList[hoveredGifIndex].account.likes.length} likes
                          </div>
                        </div>
                        <div className='create-comment-container'>
                          <textarea 
                            className="textarea"
                            value={textareaValue}
                            placeholder="Add a comment..."
                            onChange={e => handleTextareaChange(e)}
                          >
                          </textarea>
                          <div className="post-button-container" onClick={() => handleCommentSubmit(hoveredGifIndex, gifList[hoveredGifIndex])}>
                            <div className="post-button">
                              Post
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-image-right">
                <div className="right-button-background">
                  {hoveredGifIndex < gifList.length - 1 && 
                    <span className="right-button" onClick={() => handleRightClick(hoveredGifIndex)}>&gt;</span>
                  }
                </div>
              </div>
            </div>
          </div>
        }
        <div className="header-container">
          <p className="header">🖼 Solana GIFs Portal</p>
          <p className="sub-text">
            View all the funniest GIFs in the Solana metaverse ✨
          </p>
        </div>
        {!walletAddress && renderNotConnectedContainer()}
        {walletAddress && gifList && renderConnectedContainer()}
        <div className="footer-container">
        </div>
      </div>
    </div>
  );
};

export default App;
