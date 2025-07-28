class Voter:
    def __init__(self, voter_id: int, name: str):
        self.id = voter_id
        self.name = name

    def __str__(self):
        return f"Voter(id={self.id}, name='{self.name}')"

class Candidate:
    def __init__(self, candidate_id: int, name: str):
        self.id = candidate_id
        self.name = name
        self.vote_count = 0

    def __str__(self):
        return f"Candidate(id={self.id}, name='{self.name}', votes={self.vote_count})"

class VoteRecord:
    def __init__(self, voter_id: int, candidate_id: int):
        self.voter_id = voter_id
        self.candidate_id = candidate_id

    def __str__(self):
        return f"VoteRecord(voter_id={self.voter_id}, candidate_id={self.candidate_id})"

class VotingSystem:
    def __init__(self):
        self.voters = {}
        self.candidates = {}
        self.vote_records = {}

    def register_voter(self, voter: Voter):
        if voter.id in self.voters:
            print(f"Voter with ID {voter.id} already registered.")
        else:
            self.voters[voter.id] = voter
            print(f"Registered {voter}")

    def register_candidate(self, candidate: Candidate):
        if candidate.id in self.candidates:
            print(f"Candidate with ID {candidate.id} already registered.")
        else:
            self.candidates[candidate.id] = candidate
            print(f"Registered {candidate}")

    def has_voted(self, voter_id: int) -> bool:
        return voter_id in self.vote_records

    def cast_vote(self, voter_id: int, candidate_id: int):
        if voter_id not in self.voters:
            print(f"Voter ID {voter_id} not registered.")
            return
        if candidate_id not in self.candidates:
            print(f"Candidate ID {candidate_id} not registered.")
            return
        if self.has_voted(voter_id):
            print(f"Voter {voter_id} has already voted.")
            return

        self.vote_records[voter_id] = VoteRecord(voter_id, candidate_id)
        self.candidates[candidate_id].vote_count += 1
        print(f"Vote cast: Voter {voter_id} -> Candidate {candidate_id}")

    def tally_results(self):
        return sorted(self.candidates.values(), key=lambda c: c.vote_count, reverse=True)

    def display_results(self):
        print("\n=== Election Results ===")
        for candidate in self.tally_results():
            print(f"{candidate.name}: {candidate.vote_count} vote(s)")

# Demo Usage
if __name__ == "__main__":
    voting_system = VotingSystem()

    # Register voters
    voting_system.register_voter(Voter(1, "Alice"))
    voting_system.register_voter(Voter(2, "Bob"))
    voting_system.register_voter(Voter(3, "Charlie"))

    # Register candidates
    voting_system.register_candidate(Candidate(1, "John"))
    voting_system.register_candidate(Candidate(2, "Jane"))

    # Cast votes
    voting_system.cast_vote(1, 1) # Alice votes for John
    voting_system.cast_vote(2, 2) # Bob votes for Jane
    voting_system.cast_vote(3, 2) # Charlie votes for Jane
    voting_system.cast_vote(1, 2) # Alice tries to vote again

    # Display results
    voting_system.display_results()
