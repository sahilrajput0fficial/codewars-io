from core.schemas import ELOTiers , ELOThreshold

def get_elo_tiers(elo : int ) ->str:
    if elo >= ELOThreshold.diamond:
        return ELOTiers.diamond
    elif elo>= ELOThreshold.gold:
        return ELOTiers.gold
    elif elo>= ELOThreshold.silver:
        return ELOTiers.silver
    else:
        return ELOTiers.bronze