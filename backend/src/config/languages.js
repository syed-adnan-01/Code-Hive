// Supported languages configuration for Judge0 execution
// Mapping Judge0 IDs to editor and compiler details

export const SUPPORTED_LANGUAGES = [
  {
    id: 63, // JavaScript (Node.js 18.15.0 / 20.x)
    name: 'JavaScript (Node.js)',
    key: 'javascript',
    monaco: 'javascript',
    extension: 'js',
    defaultCode: `// CodeHive JavaScript Playground
function greet(name) {
  return \`Hello, \${name}! Welcome to CodeHive IDE 🐝\`;
}

console.log(greet('Developer'));
console.log('Execution environment: Node.js in sandboxed container.');
`,
    stdinCode: `// Reading from stdin in Node.js
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();

if (input) {
  console.log(\`Received stdin input: "\${input}"\`);
  const lines = input.split('\\n');
  console.log(\`Processed \${lines.length} line(s) of input.\`);
} else {
  console.log('No stdin input provided. Provide input in the stdin box!');
}
`
  },
  {
    id: 71, // Python (3.8.1 / 3.11.2)
    name: 'Python (3.x)',
    key: 'python',
    monaco: 'python',
    extension: 'py',
    defaultCode: `# CodeHive Python Playground
def main():
    name = "Developer"
    print(f"Hello, {name}! Welcome to CodeHive IDE 🐝")
    numbers = [x * 2 for x in range(1, 6)]
    print(f"Computed doubled list: {numbers}")

if __name__ == "__main__":
    main()
`,
    stdinCode: `# Reading stdin in Python
import sys

def main():
    lines = sys.stdin.read().splitlines()
    if lines:
        print(f"Read {len(lines)} line(s) from stdin:")
        for idx, line in enumerate(lines, 1):
            print(f"  Line {idx}: {line}")
    else:
        print("No stdin provided. Type input into the stdin panel.")

if __name__ == "__main__":
    main()
`
  },
  {
    id: 54, // C++ (GCC 9.2.0)
    name: 'C++ (GCC)',
    key: 'cpp',
    monaco: 'cpp',
    extension: 'cpp',
    defaultCode: `// CodeHive C++ Playground
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello from C++ in CodeHive! 🐝" << std::endl;
    std::vector<int> numbers = {10, 20, 30, 40, 50};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    std::cout << "Sum of vector elements: " << sum << std::endl;
    return 0;
}
`,
    stdinCode: `// C++ stdin reader
#include <iostream>
#include <string>

int main() {
    std::string line;
    std::cout << "Reading stdin..." << std::endl;
    while (std::getline(std::cin, line)) {
        std::cout << "Read line: " << line << std::endl;
    }
    return 0;
}
`
  },
  {
    id: 62, // Java (OpenJDK 13.0.1)
    name: 'Java (OpenJDK)',
    key: 'java',
    monaco: 'java',
    extension: 'java',
    defaultCode: `// CodeHive Java Playground
// Note: Class name must be Main for Judge0
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java in CodeHive IDE! 🐝");
        int a = 15;
        int b = 27;
        System.out.println("Computed result: " + (a * b));
    }
}
`,
    stdinCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("Reading input from stdin:");
        while (scanner.hasNextLine()) {
            String line = scanner.nextLine();
            System.out.println("Received: " + line);
        }
        scanner.close();
    }
}
`
  },
  {
    id: 74, // TypeScript (5.0.3)
    name: 'TypeScript',
    key: 'typescript',
    monaco: 'typescript',
    extension: 'ts',
    defaultCode: `// CodeHive TypeScript Playground
interface User {
  id: string;
  name: string;
  role: 'developer' | 'collaborator';
}

const currentUser: User = {
  id: 'usr_hive_1',
  name: 'CodeHive Developer',
  role: 'developer'
};

console.log(\`User \${currentUser.name} connected with role \${currentUser.role} 🚀\`);
`,
    stdinCode: `import * as fs from 'fs';

const input = fs.readFileSync(0, 'utf-8');
console.log('TypeScript stdin processor:');
console.log(input ? input.trim() : 'Empty input');
`
  },
  {
    id: 60, // Go (1.18.5 / 1.20)
    name: 'Go',
    key: 'go',
    monaco: 'go',
    extension: 'go',
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello from Go in CodeHive! 🐝")
    scores := []int{85, 92, 78, 96}
    total := 0
    for _, s := range scores {
        total += s
    }
    fmt.Printf("Average score: %.2f\\n", float64(total)/float64(len(scores)))
}
`,
    stdinCode: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    fmt.Println("Reading Go stdin:")
    for scanner.Scan() {
        fmt.Printf("Line: %s\\n", scanner.Text())
    }
}
`
  },
  {
    id: 73, // Rust (1.68.2)
    name: 'Rust',
    key: 'rust',
    monaco: 'rust',
    extension: 'rs',
    defaultCode: `fn main() {
    println!("Hello from Rust in CodeHive! 🐝");
    let numbers = vec![1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    println!("Sum calculated safely in Rust: {}", sum);
}
`,
    stdinCode: `use std::io::{self, BufRead};

fn main() {
    let stdin = io::stdin();
    println!("Reading Rust stdin:");
    for line in stdin.lock().lines() {
        if let Ok(l) = line {
            println!("Echo: {}", l);
        }
    }
}
`
  }
];

export const getLanguageById = (id) => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.id === Number(id));
};

export const getLanguageByKey = (key) => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.key === key.toLowerCase());
};
