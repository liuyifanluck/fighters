import { useEffect, useMemo, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { ethers } from 'ethers';

import { Header } from './Header';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ABI, CONTRACT_ADDRESS, IS_CONTRACT_CONFIGURED } from '../config/fighterContract';

import '../styles/FighterApp.css';

type Fighter = {
  tokenId: bigint;
  handles: readonly `0x${string}`[];
};

type AttributeState = {
  agility: number;
  strength: number;
  stamina: number;
};

type DecryptedAttributes = {
  agility: number;
  strength: number;
  stamina: number;
};

const MAX_POINTS = 10;

export function FighterApp() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const signer = useEthersSigner();
  const { instance, isLoading: isZamaLoading, error: zamaError } = useZamaInstance();

  const [distribution, setDistribution] = useState<AttributeState>({ agility: 4, strength: 3, stamina: 3 });
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [isLoadingFighters, setIsLoadingFighters] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const connectedAddress = useMemo(() => (address ? address : undefined), [address]);
  const contractConfigured = IS_CONTRACT_CONFIGURED;

  useEffect(() => {
    if (!publicClient || !connectedAddress || !contractConfigured) {
      setFighters([]);
      setListError(null);
      return;
    }

    let ignore = false;

    const load = async () => {
      setIsLoadingFighters(true);
      setListError(null);
      try {
        const tokenIds = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'fightersOf',
          args: [connectedAddress],
        })) as bigint[];

        if (ignore) {
          return;
        }

        const fightersData: Fighter[] = await Promise.all(
          tokenIds.map(async (tokenId) => {
            const attributes = (await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'getEncryptedAttributes',
              args: [tokenId],
            })) as readonly `0x${string}`[];

            return {
              tokenId,
              handles: attributes,
            };
          })
        );

        if (!ignore) {
          setFighters(fightersData);
        }
      } catch (error) {
        if (!ignore) {
          const message = error instanceof Error ? error.message : 'Failed to load fighters';
          setListError(message);
        }
      } finally {
        if (!ignore) {
          setIsLoadingFighters(false);
        }
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [publicClient, connectedAddress, refreshIndex]);

  const totalPoints = distribution.agility + distribution.strength + distribution.stamina;
  const remainingPoints = MAX_POINTS - totalPoints;

  const handleDistributionChange = (field: keyof AttributeState, value: number) => {
    if (Number.isNaN(value)) {
      return;
    }

    const capped = Math.min(Math.max(value, 0), MAX_POINTS);
    setDistribution((prev) => ({ ...prev, [field]: capped }));
  };

  const triggerRefresh = () => setRefreshIndex((prev) => prev + 1);

  const handleMint = async () => {
    if (!contractConfigured) {
      setMintError('Configure CONTRACT_ADDRESS before minting');
      return;
    }

    if (!signer) {
      setMintError('Connect a wallet to mint a fighter');
      return;
    }

    if (totalPoints !== MAX_POINTS) {
      setMintError('Attribute points must sum to 10');
      return;
    }

    setMintError(null);
    setMintSuccess(null);
    setIsMinting(true);

    try {
      const resolvedSigner = await signer;
      if (!resolvedSigner) {
        throw new Error('Signer is unavailable');
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, resolvedSigner);
      const tx = await contract.mintFighter(distribution.agility, distribution.strength, distribution.stamina);
      await tx.wait();

      setMintSuccess('Fighter minted successfully');
      triggerRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mint fighter';
      setMintError(message);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="app-shell">
      <Header />
      <main className="fighter-app">
        <section className="mint-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Mint a Fighter</h2>
              <p className="section-subtitle">Allocate 10 points across agility, strength and stamina.</p>
            </div>
          </div>

          {!contractConfigured && (
            <p className="status-note">Set the deployed contract address in <code>fighterContract.ts</code> to enable minting.</p>
          )}

          <div className="attribute-grid">
            <AttributeInput
              label="Agility"
              value={distribution.agility}
              onChange={(next) => handleDistributionChange('agility', next)}
            />
            <AttributeInput
              label="Strength"
              value={distribution.strength}
              onChange={(next) => handleDistributionChange('strength', next)}
            />
            <AttributeInput
              label="Stamina"
              value={distribution.stamina}
              onChange={(next) => handleDistributionChange('stamina', next)}
            />
          </div>

          <div className="points-summary">
            <span>Total: {totalPoints} / 10</span>
            <span className={remainingPoints === 0 ? 'points-ready' : 'points-pending'}>
              {remainingPoints === 0 ? 'Ready to mint' : `${remainingPoints} point${remainingPoints === 1 ? '' : 's'} remaining`}
            </span>
          </div>

          {mintError && <p className="feedback-error">{mintError}</p>}
          {mintSuccess && <p className="feedback-success">{mintSuccess}</p>}

          <button
            type="button"
            className="primary-button"
            onClick={handleMint}
            disabled={isMinting || totalPoints !== MAX_POINTS || !signer || !contractConfigured}
          >
            {isMinting ? 'Minting...' : 'Mint Fighter'}
          </button>
        </section>

        <section className="fighters-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Your Fighters</h2>
              <p className="section-subtitle">Decrypt attributes locally with Zama FHE when you need them.</p>
            </div>
          </div>

          {isZamaLoading && <p className="status-note">Loading encryption services…</p>}
          {zamaError && <p className="feedback-error">{zamaError}</p>}
          {listError && <p className="feedback-error">{listError}</p>}

          {!connectedAddress && <p className="status-note">Connect a wallet to view your fighters.</p>}

          {!contractConfigured && (
            <p className="status-note">Set the deployed contract address in <code>fighterContract.ts</code> to load fighters.</p>
          )}

          {connectedAddress && !isLoadingFighters && fighters.length === 0 && (
            <p className="status-note">No fighters minted yet.</p>
          )}

          {isLoadingFighters && <p className="status-note">Fetching fighters…</p>}

          <div className="fighter-grid">
            {fighters.map((fighter) => (
              <FighterCard
                key={fighter.tokenId.toString()}
                tokenId={fighter.tokenId}
                handles={fighter.handles}
                instance={instance}
                signer={signer}
                ownerAddress={connectedAddress}
                contractConfigured={contractConfigured}
                onUpdated={triggerRefresh}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

type AttributeInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function AttributeInput({ label, value, onChange }: AttributeInputProps) {
  return (
    <label className="attribute-field">
      <span>{label}</span>
      <input
        type="number"
        min={0}
        max={MAX_POINTS}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

type FighterCardProps = {
  tokenId: bigint;
  handles: readonly `0x${string}`[];
  instance: any;
  signer: ReturnType<typeof useEthersSigner>;
  ownerAddress: `0x${string}` | undefined;
  contractConfigured: boolean;
  onUpdated: () => void;
};

function FighterCard({ tokenId, handles, instance, signer, ownerAddress, contractConfigured, onUpdated }: FighterCardProps) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState<DecryptedAttributes | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [updateValues, setUpdateValues] = useState<AttributeState>({ agility: 0, strength: 0, stamina: 0 });
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (decrypted) {
      setUpdateValues(decrypted);
    }
  }, [decrypted]);

  const handleDecrypt = async () => {
    if (!contractConfigured) {
      setDecryptError('Contract address is not configured');
      return;
    }
    if (!instance) {
      setDecryptError('Encryption service is not ready yet');
      return;
    }
    if (!signer) {
      setDecryptError('Connect a wallet to decrypt attributes');
      return;
    }
    if (!ownerAddress) {
      setDecryptError('Owner address unavailable');
      return;
    }

    setDecryptError(null);
    setIsDecrypting(true);

    try {
      const signerInstance = await signer;
      if (!signerInstance) {
        throw new Error('Signer is unavailable');
      }

      const keypair = instance.generateKeypair();
      const handleContractPairs = handles.map((handle) => ({
        handle,
        contractAddress: CONTRACT_ADDRESS,
      }));

      const startTime = Math.floor(Date.now() / 1000).toString();
      const durationDays = '7';
      const contracts = [CONTRACT_ADDRESS];

      const eip712 = instance.createEIP712(keypair.publicKey, contracts, startTime, durationDays);
      const signature = await signerInstance.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contracts,
        ownerAddress,
        startTime,
        durationDays
      );

      const resolvedValues = handles.map((handle) => Number(result[handle] ?? 0));
      setDecrypted({ agility: resolvedValues[0], strength: resolvedValues[1], stamina: resolvedValues[2] });
      setUpdateValues({ agility: resolvedValues[0], strength: resolvedValues[1], stamina: resolvedValues[2] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to decrypt attributes';
      setDecryptError(message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const editTotal = updateValues.agility + updateValues.strength + updateValues.stamina;

  const handleUpdateChange = (field: keyof AttributeState, value: number) => {
    const safeValue = Math.min(Math.max(value, 0), MAX_POINTS);
    setUpdateValues((prev) => ({ ...prev, [field]: safeValue }));
  };

  const handleUpdate = async () => {
    if (!contractConfigured) {
      setUpdateError('Contract address is not configured');
      return;
    }

    if (!signer) {
      setUpdateError('Connect a wallet to update attributes');
      return;
    }

    if (editTotal !== MAX_POINTS) {
      setUpdateError('Total points must equal 10');
      return;
    }

    setUpdateError(null);
    setIsUpdating(true);

    try {
      const signerInstance = await signer;
      if (!signerInstance) {
        throw new Error('Signer is unavailable');
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerInstance);
      const tx = await contract.updateAttributes(
        tokenId,
        updateValues.agility,
        updateValues.strength,
        updateValues.stamina
      );
      await tx.wait();

      setIsEditing(false);
      setDecrypted(null);
      onUpdated();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update attributes';
      setUpdateError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <article className="fighter-card">
      <header className="fighter-card__header">
        <span className="fighter-id">Token #{tokenId.toString()}</span>
        <button
          type="button"
          className="outline-button"
          onClick={handleDecrypt}
          disabled={isDecrypting || !instance || !signer || !contractConfigured}
        >
          {isDecrypting ? 'Decrypting…' : 'Decrypt Attributes'}
        </button>
      </header>

      {decryptError && <p className="feedback-error">{decryptError}</p>}

      <div className="fighter-attributes">
        <AttributeDisplay label="Agility" value={decrypted?.agility} />
        <AttributeDisplay label="Strength" value={decrypted?.strength} />
        <AttributeDisplay label="Stamina" value={decrypted?.stamina} />
      </div>

      <footer className="fighter-actions">
        <button type="button" className="text-button" onClick={() => setIsEditing((prev) => !prev)}>
          {isEditing ? 'Cancel update' : 'Reassign attributes'}
        </button>
      </footer>

      {isEditing && (
        <div className="update-panel">
          <div className="attribute-grid">
            <AttributeInput
              label="Agility"
              value={updateValues.agility}
              onChange={(next) => handleUpdateChange('agility', next)}
            />
            <AttributeInput
              label="Strength"
              value={updateValues.strength}
              onChange={(next) => handleUpdateChange('strength', next)}
            />
            <AttributeInput
              label="Stamina"
              value={updateValues.stamina}
              onChange={(next) => handleUpdateChange('stamina', next)}
            />
          </div>

          <div className="points-summary">
            <span>Total: {editTotal} / 10</span>
            <span className={editTotal === MAX_POINTS ? 'points-ready' : 'points-pending'}>
              {editTotal === MAX_POINTS ? 'Ready to update' : `${MAX_POINTS - editTotal} point(s) remaining`}
            </span>
          </div>

          {updateError && <p className="feedback-error">{updateError}</p>}

          <button
            type="button"
            className="primary-button"
            onClick={handleUpdate}
            disabled={isUpdating || editTotal !== MAX_POINTS || !contractConfigured}
          >
            {isUpdating ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </article>
  );
}

type AttributeDisplayProps = {
  label: string;
  value: number | undefined;
};

function AttributeDisplay({ label, value }: AttributeDisplayProps) {
  return (
    <div className="attribute-display">
      <span className="attribute-label">{label}</span>
      <span className="attribute-value">{typeof value === 'number' ? value : '***'}</span>
    </div>
  );
}
