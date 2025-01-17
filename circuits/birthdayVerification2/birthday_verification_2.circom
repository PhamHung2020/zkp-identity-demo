pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/smt/smtverifier.circom";

//  getClaimHiHv calculates the hashes Hi and Hv of a claim (to be used as
//  key,value in an SMT).
template GetClaimHiHv() {
    signal input claim[8];

    signal output hi;
    signal output hv;

    component hashHi = Poseidon(4);
    for (var i=0; i<4; i++) {
        hashHi.inputs[i] <== claim[i];
    }
    hi <== hashHi.out;

    component hashHv = Poseidon(4);
    for (var i=0; i<4; i++) {
        hashHv.inputs[i] <== claim[4 + i];
    }
    hv <== hashHv.out;
}

template BirthdayClaimVerification(IssuerLevels) {
    signal input claim[8];
    signal input threshold;
    signal input claimMTP[IssuerLevels];
	signal input treeRoot;
    signal input state;

    // check schema
    claim[0] === 210459579859058135404770043788028292398;

    // check birthday
    component lessEqThan = LessEqThan(64);
    lessEqThan.in[0] <== claim[2];
    lessEqThan.in[1] <== threshold;

    lessEqThan.out === 1;

    // get hi and hv of claim
    component getClaimHiHv = GetClaimHiHv();
    for (var i = 0; i < 8; i++) {
        getClaimHiHv.claim[i] <== claim[i];
    }
    // getClaimHiHv.hi === claimHi;
    // getClaimHiHv.hv === claimHv;

    // check claim is included into the claim tree
    SMTVerifier(IssuerLevels)(
	    enabled <== 1,  // enabled
        root <== treeRoot, // root
        siblings <== claimMTP, // siblings
        oldKey <== 0, // oldKey
        oldValue <== 0, // oldValue
        isOld0 <== 0, // isOld0
        key <== getClaimHiHv.hi, // key
        value <== getClaimHiHv.hv, // value
        fnc <== 0 // fnc = inclusion
    );

    // check tree root and state match
    component hashRoot = Poseidon(1);
    hashRoot.inputs[0] <== treeRoot;

    hashRoot.out === state;

}

component main {public [threshold, state]} = BirthdayClaimVerification(8);