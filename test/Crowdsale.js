const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

// This is the Hardhat test file
// For timestamps, hardcoded unix converted numbers have been used for simplicity

// I decided not to remove many logging statements, to demonstrate how highly I value seeing the actual variable values
// Testing could have been done a lot more extensive, but because this is not a real-world application 
// it seemed unnecessary for my current goal: learning and building an MVP

describe('Crowdsale', () => {
  let crowdsale, token
  let accounts, deployer, user1
  let priceEth = 0.00025
  let priceWei = ethers.utils.parseUnits('0.00025','ether')
  let amountTokensWei = tokens(10)
  let totalPurchasePriceWei = (amountTokensWei / 1e18) * priceWei

  beforeEach(async () => {
      // Load Contracts
      const Crowdsale = await ethers.getContractFactory('Crowdsale')
      const Token = await ethers.getContractFactory('Token')

      // Deploy token
      token = await Token.deploy('Ollie Token','OLLY','1000000')

      // Configure Accounts
      accounts = await ethers.getSigners()
      deployer = accounts[0]
      user1 = accounts[1]
      user2 = accounts[2]
      user3 = accounts[3]

      // Deploy Crowdsale
      crowdsale = await Crowdsale.deploy(token.address, priceWei, '1000000', '1706742000', '1719698400', '100')

      // Send tokens to crowdsale
      let transaction = await token.connect(deployer).transfer(crowdsale.address, tokens(1000000))
      await transaction.wait()
  })

  describe('Deployment', () => {
    it('sends tokens to the Crowdsale contract', async () => {

      // const balance1 = ethers.utils.formatEther(await token.balanceOf(token.address));
      // console.log("token.balanceOf(token.address):", balance1.toString());
      // const balance2 = ethers.utils.formatEther(await token.balanceOf(crowdsale.address));
      // console.log("token.balanceOf(crowdsale.address):", balance2.toString());
      // const balance3 = ethers.utils.formatEther(await token.balanceOf(deployer.address));
      // console.log("token.balanceOf(deployer.address):", balance3.toString());
      // const balance4 = ethers.utils.formatEther(await token.balanceOf(user1.address));
      // console.log("token.balanceOf(user1.address):", balance4.toString());

      expect(await token.balanceOf(crowdsale.address)).to.eq(tokens(1000000))
    })

    it('returns token address', async () => {
      expect(await crowdsale.token()).to.eq(token.address)
    })

    it('returns the price', async () => {
      expect(await crowdsale.price()).to.eq(ether(0.00025))
    })
  })

  describe('buyTokens function n=1', () => {
    let transaction, result
    // let eth_old = tokens(20)

    describe('n=1 Success', () => {
      beforeEach(async () => {
        transaction1 = await crowdsale.connect(deployer).addToWhitelist(user1.address)
        // console.log('amountTokensWei',amountTokensWei) --delete this
        // console.log('totalPurchasePriceWei',totalPurchasePriceWei) --delete this
        // console.log('value: ether(totalPurchasePriceWei)',ether(totalPurchasePriceWei)) --delete this
        // transaction1 = await crowdsale.connect(user1).buyTokens(amountTokensWei, { value: ether(20) }) --delete this
        // console.log() --delete this
        transaction1 = await crowdsale.connect(user1).buyTokens(amountTokensWei, { value: totalPurchasePriceWei })
        result = await transaction1.wait()

        // transaction2 = await crowdsale.connect(deployer).addToWhitelist(user2.address)
        // transaction2 = await crowdsale.connect(user2).buyTokens(amountTokensWei, { value: ether(20) })
        // result = await transaction1.wait()
      })


      it('crowdsale contract keeps holding max amountTokensWei of tokens', async () => {
        console.log('token value of user1:', await crowdsale.contributions(user1.address).tokenAmountWei)
        expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(1000000))
        expect(await token.balanceOf(user1.address)).to.equal(0)
      })

      it('test with values from react app', async () => {
        let amountTokensWei3 = ethers.BigNumber.from('100000000000000000000')
        let valueWei3 = ethers.BigNumber.from('25000000000000000')
        let transaction3 = await crowdsale.connect(user1).buyTokens(amountTokensWei3, { value: valueWei3 })
        // let transaction1 = await crowdsale.connect(user1).buyTokens(amountTokensWei, { value: totalPurchasePriceWei })
        await transaction3.wait()
      })

      it('updates contracts ether balance', async () => {
        // console.log('amountTokensWei',amountTokensWei)
        // console.log('price',price)
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(totalPurchasePriceWei)
      })

      it('updates tokensSold', async () => {
        expect(await crowdsale.tokensSold()).to.equal(amountTokensWei)
      })

      it('emits a buy event', async () => {
        const event = result.events[0]
        const event_args = result.events[0].args
        // console.log(event)
        // console.log(event_args)
        expect(event.event).to.equal('Buy')
        expect(event_args.buyer).to.equal(user1.address)
        expect(event_args.amount_tokens).to.equal(amountTokensWei)
        expect(event_args.amount_eth).to.equal(totalPurchasePriceWei)
      })

      it('updates contributions mapping for tokens and eth', async () => {
        const contribution = await crowdsale.contributions(user1.address)
        // console.log('mapping.etherAmountWei', contribution.etherAmountWei)
        // console.log('variable containing flat eth amountTokensWei',eth)
        expect(contribution.etherAmountWei).to.equal(totalPurchasePriceWei)
        expect(contribution.tokenAmountWei).to.equal(amountTokensWei)
      })
    })

    describe('Failure', () => {
      it('rejects insufficient ETH', async () => {
        await expect(crowdsale.connect(user1).buyTokens(tokens(10), { value: 0 })).to.be.reverted
      })
    })
  })

  describe('buyTokens function n=2', () => {
  let transaction, result
  let amountTokensWei = tokens(10)

    describe('n=2 Success', () => {
      beforeEach(async () => {
        transaction1 = await crowdsale.connect(deployer).addToWhitelist(user1.address)
        transaction1 = await crowdsale.connect(user1).buyTokens(amountTokensWei, { value: totalPurchasePriceWei })
        result = await transaction1.wait()

        transaction2 = await crowdsale.connect(deployer).addToWhitelist(user2.address)
        transaction2 = await crowdsale.connect(user2).buyTokens(amountTokensWei, { value: totalPurchasePriceWei })
        result = await transaction1.wait()
      })

      it('same user can buy twice', async () => {
        transaction1 = await crowdsale.connect(user1).buyTokens(amountTokensWei, { value: totalPurchasePriceWei })
      })

      // it('same user can buy twice_v2', async () => {
      // // let transaction = await crowdsale.connect(user1.address).buyTokens(50)//, 125000000000000000)
      // let transaction1 = await crowdsale.connect(user1).buyTokens(ethers.BigNumber.from("50000000000000000000"), { value: ethers.utils.parseUnits("0.125", "ether") });
      // await transaction.wait()
      // })

      it('same user can buy twice_v2', async () => {
      let price1 = ethers.utils.parseUnits('0.00025','ether')
      let amount1 = 10
      let formattedAmount1 = ethers.utils.parseUnits(amount1.toString(), 'ether')
      let value1 = ethers.utils.parseUnits((amount1 / 1e18 * price1).toString(), 'ether')

      // console.log('price1',price1)
      // console.log('amount1',amount1)
      // console.log('formattedAmount1',formattedAmount1)
      // console.log('value1',value1)

      let transaction = await crowdsale.connect(user1).buyTokens(formattedAmount1, { value: value1 })
      await transaction.wait()
      })

      it('n=2 crowdsale contract keeps holding max amountTokensWei of tokens', async () => {
        // console.log("test:", token.address);

        expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(1000000))
        expect(await token.balanceOf(user1.address)).to.equal(0)
      })

      it('n=2 updates contracts ether balance', async () => {
        // console.log('amountTokensWei',amountTokensWei)
        // console.log('price',price)
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(ethers.BigNumber.from(2*totalPurchasePriceWei))
      })

      it('n=2 updates tokensSold', async () => {
        expect(await crowdsale.tokensSold()).to.equal(amountTokensWei.mul(ethers.BigNumber.from(2)))
      })

      // it('n=2 emits a buy event', async () => {
      //   await expect(transaction).to.emit(crowdsale, 'Buy')
      //     .withArgs(amountTokensWei, user1.address)
      // })

      it('n=2 updates contributions mapping for tokens and eth', async () => {
        const contribution1 = await crowdsale.contributions(user1.address)
        expect(contribution1.etherAmountWei).to.equal(totalPurchasePriceWei)
        expect(contribution1.tokenAmountWei).to.equal(amountTokensWei)
        const contribution2 = await crowdsale.contributions(user2.address)
        expect(contribution2.etherAmountWei).to.equal(totalPurchasePriceWei)
        expect(contribution2.tokenAmountWei).to.equal(amountTokensWei)
      })
    })

    describe('n=2 Failure', () => {
      it('rejects insufficient ETH', async () => {
        await expect(crowdsale.connect(user1).buyTokens(tokens(10), { value: 0 })).to.be.reverted
        await expect(crowdsale.connect(user2).buyTokens(tokens(10), { value: 0 })).to.be.reverted
      })
    })
  })


  describe('Vending Machine - Sending ETH', () => {
    let transaction, result
    // let amountTokensWei = ether(20)
    let send_wei = ether(20)
    let amountTokensEth = send_wei.div(priceWei)
    let amountTokensWei = ethers.utils.parseEther(amountTokensEth.toString())

    describe('Vending Machine Success', () => {

      beforeEach(async () => {
        transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address)
        transaction = await user1.sendTransaction({ to: crowdsale.address, value: send_wei })
        result = await transaction.wait()
      })

      it('updates contracts ether balance', async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(send_wei)
      })

      it('updates user token balance', async () => {
        // expect(await token.balanceOf(user1.address)).to.equal(amountTokensWei)
        const contribution = await crowdsale.contributions(user1.address)
        // console.log('send_wei', send_wei) //20
        // console.log('wei sent in transaction = ether(20)', ether(20)) //20
        // console.log('contribution.tokenAmountWei', contribution.tokenAmountWei) //20
        // console.log('amountTokensWei variable', amountTokensWei)           //40
        expect(contribution.etherAmountWei).to.equal(send_wei)
        expect(contribution.tokenAmountWei).to.equal(amountTokensWei)
      })
      
    })

  })

  describe('Updating Price', () => {
    let transaction, result
    let price2 = ether(4)

    describe('Success', () => {

      beforeEach(async () => {
        transaction = await crowdsale.connect(deployer).setPrice(ether(4))
        result = await transaction.wait()
      })

      it('updates the price', async () => {
        expect(await crowdsale.price()).to.equal(ether(4))
      })

    })

    describe('Failure', () => {

      it('prevents non-owner from updating price', async () => {
        await expect(crowdsale.connect(user1).setPrice(price2)).to.be.reverted
      })

    })
  })

  describe('Finalizing ICO', () => {
    let transaction, result
      // let priceEth = 0.00025
      // let priceWei = ethers.utils.parseUnits('0.00025','ether')
      // let amountTokensWei = tokens(10)
      // let totalPurchasePriceWei = (amountTokensWei / 1e18) * priceWei
    // let value = ether(20)

    describe('Finalizing ICO: Success', () => {
      beforeEach(async () => {

        // console.log('token.balanceOf(user1.address)',await token.balanceOf(user1.address))
        // console.log('token.balanceOf(user2.address))',await token.balanceOf(user2.address))
        // console.log('token.balanceOf(crowdsale.address)',await token.balanceOf(crowdsale.address))
        // console.log('token.balanceOf(deployer.address)',await token.balanceOf(deployer.address))

        await crowdsale.connect(deployer).changeIcoEnd(1706684614)
        await crowdsale.connect(deployer).addToWhitelist(user1.address)
        await crowdsale.connect(user1).buyTokens(amountTokensWei, { value: totalPurchasePriceWei})
        await crowdsale.connect(deployer).addToWhitelist(user2.address)
        await crowdsale.connect(user2).buyTokens(amountTokensWei, { value: totalPurchasePriceWei})
        await crowdsale.connect(deployer).changeFundraisingGoal(tokens(1))

        // let icoFinalized = await crowdsale.icoFinalized();
        // console.log('icoFinalized:', icoFinalized);

        transaction = await crowdsale.connect(deployer).finalize()
        result = await transaction.wait()
      })

      it('changes icoFinalized to true', async () => {
        expect(await crowdsale.icoFinalized()).to.equal(true)
      })

      it('in case of finalize success: transfers token balance to contributors', async () => {
        // console.log('token.balanceOf(user1.address)',await token.balanceOf(user1.address))
        // console.log('token.balanceOf(user2.address))',await token.balanceOf(user2.address))
        // console.log('token.balanceOf(crowdsale.address)',await token.balanceOf(crowdsale.address))
        // console.log('token.balanceOf(deployer.address)',await token.balanceOf(deployer.address))
        expect(await token.balanceOf(user1.address)).to.equal(amountTokensWei)
        expect(await token.balanceOf(user2.address)).to.equal(amountTokensWei)
        expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(999980))
        let contributor1 = await crowdsale.contributions(user1.address)
        let contributor2 = await crowdsale.contributions(user2.address)
        expect(contributor1.tokenAmountWei).to.equal(0)
        expect(contributor2.tokenAmountWei).to.equal(0)
      })

      it('emits finalize event', async () => {
        const event = result.events[0]
        // const event_args = result.events[0].args
        // console.log(event)
        // console.log(event_args)
        await expect(transaction).to.emit(crowdsale, 'FinalizeSuccess')
          // .withArgs(tokensSold, value)
      })
    })

    describe('Finalizing ICO: Failure end time', () => {

      it('does not finalize before the icoEnd time', async () => {
        await expect(crowdsale.connect(deployer).finalize()).to.be.reverted;
      })
    })

    describe('Finalizing ICO: Failure Fundraising Goal not met', () => {
      beforeEach(async () => {
        await crowdsale.connect(deployer).changeIcoEnd(1706684614)
        await crowdsale.connect(deployer).changeFundraisingGoal(tokens(100))
        await crowdsale.connect(deployer).addToWhitelist(user1.address)
        await crowdsale.connect(deployer).addToWhitelist(user2.address)

        let transaction1 = await crowdsale.connect(user1).buyTokens(amountTokensWei, { value: totalPurchasePriceWei})
        let txReceipt1 = await transaction1.wait()
        let transaction1_gas = (txReceipt1.gasUsed).mul(transaction1.gasPrice);

        let transaction2 = await crowdsale.connect(user2).buyTokens(amountTokensWei, { value: totalPurchasePriceWei})
        let txReceipt2 = await transaction2.wait()
        let transaction2_gas = (txReceipt2.gasUsed).mul(transaction2.gasPrice);


      })

      it('in case of finalize failure: sends eth back to contributors', async () => {
        let user1_t1_ether_balance = await ethers.provider.getBalance(user1.address)
        let user2_t1_ether_balance = await ethers.provider.getBalance(user2.address)
        // console.log('user1_t1_ether_balance',user1_t1_ether_balance)
        // console.log('user2_t1_ether_balance',user2_t1_ether_balance)

        transaction = await crowdsale.connect(deployer).finalize()
        result = await transaction.wait()

        const user1_t2_ether_balance = await ethers.provider.getBalance(user1.address);
        // console.log('user1_t2_ether_balance',user1_t2_ether_balance)
        await expect(user1_t2_ether_balance).to.equal(user1_t1_ether_balance.add(totalPurchasePriceWei));
        const user2_t2_ether_balance = await ethers.provider.getBalance(user2.address);
        await expect(user2_t2_ether_balance).to.equal(user2_t1_ether_balance.add(totalPurchasePriceWei));
      })
    })
  })

  describe('!NOT RELEVANT ANYMORE Whitelist Functions', () => {
    let transaction, result

    describe('!NOT RELEVANT ANYMORE Whitelist Functions: Failure', () => {
      it('prevents non-whitelisted address from buying tokens', async () => {
        await expect(crowdsale.connect(user3).buyTokens(tokens(10))).to.be.reverted;
      })
    })
  })

  describe('ICO Start Time', () => {
    let transaction, result

    describe('Failure', () => {

       it('prevents buying tokens before start time', async () => {
        transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address)
        transaction = await crowdsale.connect(deployer).changeIcoStart(2706599640)
        await expect(crowdsale.connect(user1).buyTokens(amountTokensWei, { value: totalPurchasePriceWei})).to.be.reverted
      })
    })
  })

  describe('Array/Mapping Checks', () => {

    describe('Success', () => {
    let transaction, result

    beforeEach(async () => {
      await crowdsale.connect(deployer).addToWhitelist(user1.address)
      await crowdsale.connect(user1).buyTokens(amountTokensWei, { value: totalPurchasePriceWei })
      await crowdsale.connect(deployer).addToWhitelist(user2.address)
      await crowdsale.connect(user2).buyTokens(amountTokensWei, { value: totalPurchasePriceWei })
    })

      it('Puts addresses in mapping', async () => {
        const firstAddress = await crowdsale.contributionAddresses(0);
        const secondAddress = await crowdsale.contributionAddresses(1);
        expect(firstAddress).to.equal(user1.address);
        expect(secondAddress).to.equal(user2.address);
      })
    })
  })
})
