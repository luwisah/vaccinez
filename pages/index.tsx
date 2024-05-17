import {
  useActiveClaimConditionForWallet,
  useAddress,
  useClaimConditions,
  useClaimerProofs,
  useClaimIneligibilityReasons,
  useContract,
  useContractMetadata,
  useTotalCirculatingSupply,
  Web3Button,
  ConnectWallet
} from "@thirdweb-dev/react";
import { BigNumber, utils } from "ethers";
import type { NextPage } from "next";
import { useEffect, useMemo, useState } from "react";
import styles from "../styles/Theme.module.css";
import { parseIneligibility } from "../utils/parseIneligibility";
import { myEditionDropContractAddress, tokenId } from "../const/yourDetails";
import styled from 'styled-components';


const Home: NextPage = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("")
  const nftViewUrl = "https://testnet.rarible.com/token/0xee20effe85f7b01cf654b43c7573f8d6f1fc59c4:0";
 // Replace with your target date and time

 const [remainingTime, setRemainingTime] = useState("");
 const targetDate = new Date("2024-01-30T09:43:00Z").getTime();
 

 let myVar: string | undefined;
 let safeVar: string = myVar ?? "defaultString";
 useEffect(() => {
   const intervalId = setInterval(() => {
     const currentTime = new Date().getTime();
     const timeDifference = targetDate - currentTime;

     if (timeDifference > 0) {
       const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
       const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
       const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
       const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

       setRemainingTime(`${days}d ${hours}h ${minutes}m ${seconds}s`);

       if (days === 0 && hours === 0 && minutes === 0 && seconds === 1) {
         setTimeout(() => {
           window.location.reload();
         }, 10000);
       }
     } else {
       setRemainingTime("Stage 2 starting...");
       clearInterval(intervalId);
     }
   }, 1000);

   return () => clearInterval(intervalId);
 }, []);

  const handleClosePopup = () => {
    setShowPopup(false);
    setPopupMessage("");
  };
  // Define outside of the component
  const StyledButton = styled.button`
  // styles
  font-family: Cascadia Mono, sans-serif;
  font-weight: bold;
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: ${props => props.disabled ? 'grey' : 'transparent'};
  color: white;
  padding: 4px 7px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  // Add more styles as needed
`;
  const buttonStyles = {
    backgroundColor: isHovered ? '#2fff00' : 'white',
    color: isHovered ? '#2fff00' : 'black',
    borderRadius: '8px',
    border: isHovered ? '1px solid transparent' : '1px solid white',
    transition: 'background-color 0.3s, box-shadow 0.3s, color 0.3s', // Add transition for smooth effect
    boxShadow: isHovered ? '0 0 10px #2fff00' : 'none', // Adjust shadow based on hover state
  };
  const StyledConnectWallet = styled(ConnectWallet)`
  font-family: 'Inter, sans-serif';
  `;


  const divTextStyles = {
    color: 'black', // Set text color to black for the entire div
  };
  const address = useAddress();
  const [quantity, setQuantity] = useState(0);
  const { contract: editionDrop } = useContract(myEditionDropContractAddress);
  const { data: contractMetadata } = useContractMetadata(editionDrop);

  const claimConditions = useClaimConditions(editionDrop);
  const activeClaimCondition = useActiveClaimConditionForWallet(
    editionDrop,
    address,
    tokenId
  );
  const claimerProofs = useClaimerProofs(editionDrop, address || "", tokenId);
  const claimIneligibilityReasons = useClaimIneligibilityReasons(
    editionDrop,
    {
      quantity,
      walletAddress: address || "",
    },
    tokenId
  );
  
  
  const claimedSupply = useTotalCirculatingSupply(editionDrop, tokenId);

  const totalAvailableSupply = useMemo(() => {
    try {
      return BigNumber.from(activeClaimCondition.data?.availableSupply || 0);
    } catch {
      return BigNumber.from(1_000_000);
    }
  }, [activeClaimCondition.data?.availableSupply]);

  const numberClaimed = useMemo(() => {
    return BigNumber.from(claimedSupply.data || 0).toString();
  }, [claimedSupply]);

  const numberTotal = useMemo(() => {
    const n = totalAvailableSupply.add(BigNumber.from(claimedSupply.data || 0));
    if (n.gte(1_000_000)) {
      return "";
    }
    return n.toString();
  }, [totalAvailableSupply, claimedSupply]);

  const [claimedByUser, setClaimedByUser] = useState(0);

  const priceToMint = useMemo(() => {
    const bnPrice = BigNumber.from(
      activeClaimCondition.data?.currencyMetadata.value || 0
    );
    return `${utils.formatUnits(
      bnPrice.mul(quantity).toString(),
      activeClaimCondition.data?.currencyMetadata.decimals || 18
    )} ${activeClaimCondition.data?.currencyMetadata.symbol}`;
  }, [
    activeClaimCondition.data?.currencyMetadata.decimals,
    activeClaimCondition.data?.currencyMetadata.symbol,
    activeClaimCondition.data?.currencyMetadata.value,
    quantity,
  ]);

  const maxClaimable = useMemo(() => {
    let bnMaxClaimable;
    try {
      bnMaxClaimable = BigNumber.from(
        activeClaimCondition.data?.maxClaimableSupply || 0
      );
    } catch (e) {
      bnMaxClaimable = BigNumber.from(1_000_000);
    }

    let perTransactionClaimable;
    try {
      perTransactionClaimable = BigNumber.from(
        activeClaimCondition.data?.maxClaimablePerWallet || 0
      );
    } catch (e) {
      perTransactionClaimable = BigNumber.from(1_000_000);
    }

    if (perTransactionClaimable.lte(bnMaxClaimable)) {
      bnMaxClaimable = perTransactionClaimable;
    }

    const snapshotClaimable = claimerProofs.data?.maxClaimable;

    if (snapshotClaimable) {
      if (snapshotClaimable === "0") {
        // allowed unlimited for the snapshot
        bnMaxClaimable = BigNumber.from(1_000_000);
      } else {
        try {
          bnMaxClaimable = BigNumber.from(snapshotClaimable);
        } catch (e) {
          // fall back to default case
        }
      }
    }

    let max;
    if (totalAvailableSupply.lt(bnMaxClaimable)) {
      max = totalAvailableSupply;
    } else {
      max = bnMaxClaimable;
    }

    if (max.gte(1_000_000)) {
      return 1_000_000;
    }
    return max.toNumber();
  }, [
    claimerProofs.data?.maxClaimable,
    totalAvailableSupply,
    activeClaimCondition.data?.maxClaimableSupply,
    activeClaimCondition.data?.maxClaimablePerWallet,
  ]);

  const [updateTrigger, setUpdateTrigger] = useState(false);

  useEffect(() => {
    async function fetchUserBalance() {
        if (address && editionDrop) {
            const balance = await editionDrop.call("balanceOf", [address, tokenId]);
            setUserBalance(balance.toNumber());
        }
    }
    
    fetchUserBalance();
}, [address, editionDrop, updateTrigger]);
  
  const isSoldOut = useMemo(() => {
    try {
      return (
        (activeClaimCondition.isSuccess &&
          BigNumber.from(activeClaimCondition.data?.availableSupply || 0).lte(
            0
          )) ||
        numberClaimed === numberTotal
      );
    } catch (e) {
      return false;
    }
  }, [
    activeClaimCondition.data?.availableSupply,
    activeClaimCondition.isSuccess,
    numberClaimed,
    numberTotal,
  ]);

  const canClaim = useMemo(() => {
    return (
      activeClaimCondition.isSuccess &&
      claimIneligibilityReasons.isSuccess &&
      claimIneligibilityReasons.data?.length === 0 &&
      !isSoldOut
    );
  }, [
    activeClaimCondition.isSuccess,
    claimIneligibilityReasons.data?.length,
    claimIneligibilityReasons.isSuccess,
    isSoldOut,
  ]);

  const isLoading = useMemo(() => {
    return (
      activeClaimCondition.isLoading || claimedSupply.isLoading || !editionDrop
    );
  }, [activeClaimCondition.isLoading, editionDrop, claimedSupply.isLoading]);

  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    async function fetchUserBalance() {
        if (address && editionDrop) {
          const balance = await editionDrop.call("balanceOf", [address, tokenId]);
            setUserBalance(balance.toNumber());
        }
    }
    
    fetchUserBalance();
  }, [address, editionDrop]);
  
  const remainingClaimable = maxClaimable - userBalance;
  const buttonStyle = quantity === 0 
    ? { backgroundColor: 'grey', color: 'white', cursor: 'not-allowed', border: '1px solid grey', boxShadow: 'none' }
    : { backgroundColor: isHovered ? '#2fff00' : 'white',
    color: isHovered ? '#2fff00' : 'black',
    borderRadius: '8px',
    border: isHovered ? '1px solid transparent' : '1px solid white',
    transition: 'background-color 0.3s, box-shadow 0.3s, color 0.3s', // Add transition for smooth effect
    boxShadow: isHovered ? '0 0 10px #2fff00' : 'none', // Adjust shadow based on hover state
  };

  const buttonLoading = useMemo(
    () => isLoading || claimIneligibilityReasons.isLoading,
    [claimIneligibilityReasons.isLoading, isLoading]
  );
  const buttonText = useMemo(() => {
    if (isSoldOut) {
      return "Sold Out";
    }

    if (canClaim) {
      const pricePerToken = BigNumber.from(
        activeClaimCondition.data?.currencyMetadata.value || 0
      );
      if (pricePerToken.eq(0)) {
        return "Claim (Free)";
      }
      return `Claim (${priceToMint})`;
    }
    if (claimIneligibilityReasons.data?.length) {
      return parseIneligibility(claimIneligibilityReasons.data, quantity);
    }
    if (buttonLoading) {
      return "Checking eligibility...";
    }

    return "Claiming not available";
  }, [
    isSoldOut,
    canClaim,
    claimIneligibilityReasons.data,
    buttonLoading,
    activeClaimCondition.data?.currencyMetadata.value,
    priceToMint,
    quantity,
  ]);

    return (
      <div className={styles.container}>
        <div className={styles.connectWalletButton}>
            <ConnectWallet/>
        </div>
        <div className={styles.titleImageContainer}>
        <img 
            src="https://media.discordapp.net/attachments/651171521141932035/1198589390302232597/dbl.png?ex=6624f7db&is=661282db&hm=c4a92c9f1547a79e55af2da6c7fa9299886d6aa96deb85f8e0452c54e85f3fcd&=&format=webp&quality=lossless&width=708&height=175" 
            alt="drbrainzlab" 
            className={styles.titleImage}
          />
        </div>
        {showPopup && (
            <div className={styles.popupContainer}>
              <div className={styles.popupContent}>
                <StyledButton onClick={handleClosePopup} className={styles.closeButton}>X</StyledButton>
                <div style={{fontFamily: 'Cascadia Mono, sans-serif', fontSize: '20px'}}>{popupMessage.split(' View your NFTs ')[0]}</div>
                {popupType === "success" && (
                  <>
                    <img src="https://cdn.discordapp.com/attachments/651171521141932035/1197689531344883833/SPOILER_CuRed_graphicblackbg2.gif?ex=6621b1cc&is=660f3ccc&hm=e5643eca1a773d2f7afd9ec6bcab6a3523ffccc9d470d03abe9eb0fa8cbae2ba&" className={styles.yourGifClass} />
                    <a href={nftViewUrl} target="_blank" rel="noopener noreferrer">View your NFTs</a>
                  </>
                )}
              </div>
            </div>
          )}

        
        <div className={styles.mintInfoContainer}>
                  {/* New Title and Description */}
              <div className={styles.titleDescriptionSection}>
                <div className={styles.h1}>
                <h1 className={styles.h1}>
                    {parseInt(activeClaimCondition.data?.maxClaimableSupply || "0") === 111 ?
                      'PURCHASE YOUR ' : 'CLAIM YOUR '} 
                    <span className={styles.greenGlowText}>VACCINEZ</span>
                  </h1> 
                </div>
                {parseInt(activeClaimCondition.data?.maxClaimableSupply || "0") === 111 ? (
                  <div  style={{fontFamily: 'Brainzbridge1, sans-serif', fontSize: '20px'}}>
                    STAGE 1 IS OVER<br/><br/>Now is your last chance to grab some of <br/>Dr. bRAinZ mysterious potion<br/><br/>
                    Claim extra VaccineZ to increase the potency of your reGenZ<br/><br/>
                    You can purchase upto 11 vaccinez for only 0.001 eth each
                  </div>
                ) : (
                  <div  style={{fontFamily: 'Brainzbridge1, sans-serif', fontSize: '20px'}}>
                    If you own any deGenZ or have bought VaccineZ in the BRNZ store, claim your VaccineZ now.<br/><br/>
                    If the above does not apply to you or you would like to purchase more vaccinez, please wait for Stage 2 where you can purchase VaccineZ for 0.001 eth each.<br/><br/>
                    *Note - there will be a limit of 11 vaccinez per wallet address during Stage 2.
                  </div>
                  
                )}
              </div>
          <div className={styles.previewImageSection}>
          <img
                  className={styles.image}
                  src={"https://raw.githubusercontent.com/luwisah/vaccinez/main/SPOILER_CuRed_graphicblackbg2.gif"}
                  alt={`${contractMetadata?.name} preview image`}
                />
            </div>
          {isLoading ? (
            <p className={styles.titleDescriptionSection}>Loading...</p>
          ) : (
            <>
              <div className={styles.mintingOptionsSection}>
                  {/* Image Preview of NFTs */}
                <div className={styles.h2}>
                {parseInt(activeClaimCondition.data?.maxClaimableSupply || "0")=== 111 ?
                    <h1>FINAL STAGE: <span className={styles.blueGlowText}>2/2</span></h1> :
                    <h1>STAGE: <span className={styles.blueGlowText}>1/2</span></h1>
                  }
                </div>
                {parseInt(activeClaimCondition.data?.maxClaimableSupply || "0")=== 111 ?
                <div>
                </div> : <div style={{fontFamily: 'Brainzbridge1, sans-serif', fontSize: '20px'}} className={styles.countdown}>
                  TIME REMAINING: <b><span className={styles.pinkGlowText}>{remainingTime}</span></b></div>}
                  {/* Amount claimed so far */}
                  <div className={styles.titleDescriptionSection}>
                    <div className={styles.titleDescriptionSection}>
                      {claimedSupply ? (
                        <p>
                          TOTAL <span className={styles.greenGlowText}>VACCINEZ</span> CLAIMED   :   <b><span className={styles.pinkGlowText}>{numberClaimed}</span></b>
                          <b><span className={styles.pinkGlowText}>{" / "}</span></b>
                          <b><span className={styles.pinkGlowText}>{numberTotal || "999"}</span></b>
                        </p>
                      ) : (
                        // Show loading state if we're still loading the supply
                        <p>Loading...</p>
                      )}
                    </div>
                  </div>

                {claimConditions.data?.length === 0 ||
                claimConditions.data?.every(
                  (cc) => cc.maxClaimableSupply === "0"
                ) ? (
                  <div>
                    <h2>
                      This drop is not ready to be minted yet. (No claim condition
                      set)
                    </h2>
                  </div>
                ) : (
                  <>
                    <div className={styles.titleDescriptionSection}>
                      {address ? (
                        <div className={styles.claimStatus}>
                          {parseInt(activeClaimCondition.data?.maxClaimableSupply || "0") === 111 ? (
                            <p>
                              YOUR CURRENT VACCINE BALANCE: <b><span className={styles.pinkGlowText}> {userBalance}</span></b><br/><br/>
                              *33 VACCINEZ LIMIT
                            </p>
                          ) : (
                            maxClaimable > 0 ? (
                              <p>
                                YOUR CURRENT VACCINE BALANCE: <b><span className={styles.pinkGlowText}>{userBalance}</span></b><br/><br/>
                                YOU HAVE <span className={styles.pinkGlowText}>{remainingClaimable}</span> VACCINEZ LEFT TO CLAIM 
                              </p>
                            ) : (
                              <p>
                                This wallet is not eligible to claim any VaccineZ. Please reconnect with an eligible wallet or wait until the Stage 2 where you will be able to purchase VaccineZ for .001 eth each.
                              </p>
                            )
                          )}
                        </div>
                      ) : (
                        <h2>Please connect an eligible wallet to claim VaccineZ</h2>
                      )}
                    </div>

                    {address && maxClaimable > 0 && !isSoldOut && (
                      <div className={styles.quantityContainer}>
                        <button
                          className={`${styles.quantityControlButton}`}
                          onClick={() => setQuantity(quantity - 1)}
                          disabled={quantity <= 0 || !address}
                        >
                          -
                        </button>

                        <h4 className={quantity === 0 ? `${styles.blueGlowText} ${styles.greyText}` : styles.blueGlowText}>{quantity}</h4>

                        <button
                          className={`${styles.quantityControlButton}`}
                          onClick={() => {
                            // Check if the incremented quantity would exceed the remaining balance
                            if (quantity + 1 > remainingClaimable) {
                              setQuantity(remainingClaimable); // Set to remaining balance if it does
                            } else {
                              setQuantity(quantity + 1); // Increment normally if it doesn't
                            }
                          }}
                          disabled={quantity >= remainingClaimable || !address}
                        >
                          +
                        </button>
                      </div>
                    )}
                    {address && maxClaimable > 0 && !isSoldOut && (
                      <div className={styles.mintContainer}>
                      <div
                        className="button"
                        style={{ ...buttonStyles, ...divTextStyles, ...buttonStyle }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                      >
                          <Web3Button
                            className="button"
                            contractAddress={editionDrop?.getAddress() || ""}
                            style={{
                              backgroundColor: 'transparent',
                              color: 'black',
                              fontFamily: 'Cascadia Mono, sans-serif',
                              transition: 'background-color 0.3s, box-shadow 0.3s, color 0.3s', // Add transition for smooth effect
                              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)', // Add box shadow
                            }}
                            action={(cntr) => cntr.erc1155.claim(tokenId, quantity)}
                            onError={(err) => {
                              console.error(err);
                              setShowPopup(true);
                              setQuantity(0);
                              setPopupType("failure");
                              setPopupMessage("Failed to claim your VaccineZ, please try again.");
                            }}
                            onSuccess={() => {
                              setQuantity(0);
                              setClaimedByUser(claimedByUser + quantity);
                              setUpdateTrigger((prev) => !prev);
                              setShowPopup(true);
                              setPopupType("success");
                              setPopupMessage(`Congratulations! You have successfully claimed ${quantity} Vaccine${quantity > 1 ? 'Z' : ''}. View your NFTs [here](${nftViewUrl}).`);
                            }}
                          >
                            {buttonLoading ? "Loading..." : 
                              parseInt(activeClaimCondition.data?.maxClaimableSupply || "0") === 111 && quantity > 0 ?
                              `CLAIM VACCINEZ (${(quantity * 0.001).toFixed(4)} eth)` :
                              'CLAIM VACCINEZ'
                            }
                          </Web3Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

export default Home;
