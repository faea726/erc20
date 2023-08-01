import os
import secrets

from eth_account import Account


def main():
    num_wallet = int(input("number of wallets: "))
    output_file = "wallets.csv"
    for _ in range(num_wallet):
        res = genereate_key()
        write_to_file(output_file, res)


def genereate_key() -> str:
    priv = secrets.token_hex(32)
    private_key = "0x" + priv
    acct = Account.from_key(private_key)
    return f"{private_key},{acct.address}"


def write_to_file(file: str, text: str):
    if not os.path.isfile(file):
        with open(file, mode="w") as f:
            f.write("private_key,address\n")

    with open(file, mode="a") as f:
        f.write(f"{text}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        exit()
