import json

from infer import load_model, ask_character


neeko_model = None
neeko_tokenizer = None

try:
    neeko_tokenizer, neeko_model = load_model(lora_path="data/train_output")
except Exception as e:
    raise e

with open('tests.json', 'r') as file:
    data = json.load(file)

for category, characters in data.get('tests', {}).items():
    print(f"\nCategory: {category}")

    # Iterate through each character in the category
    for character, questions in characters.items():
        if questions:
            print(f"\nPerforming tests for {character}:")
            for i in range(2):
                question = questions[i]
                print(f"  Test {i + 1}. Question: '{question}'")
                generated_text = ask_character(model=neeko_model, tokenizer=neeko_tokenizer, character=characters,
                                               profile_dir="data/seed_data/profiles", embed_dir="data/embed",
                                               question=question)
                print(f"  Test {i + 1}. Answer: '{generated_text}'\n")
        print('------------------------------------------------------------------------------\n')
    print('###################################################################################\n')


