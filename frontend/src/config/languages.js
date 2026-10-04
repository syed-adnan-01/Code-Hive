// Supported programming languages for Judge0 execution and Monaco Editor

export const SUPPORTED_LANGUAGES = [
  {
    id: 63,
    name: 'JavaScript (Node.js)',
    key: 'javascript',
    monaco: 'javascript',
    extension: 'js',
    badgeColor: '#f7df1e',
    defaultCode: `// CodeHive JavaScript Playground
function solve() {
  const message = "Hello from JavaScript in CodeHive! 🐝";
  console.log(message);
  
  const numbers = [1, 2, 3, 4, 5];
  const doubled = numbers.map(n => n * 2);
  console.log("Doubled array:", doubled);
}

solve();
`,
    stdinTemplate: `// Reading standard input in Node.js
const fs = require('fs');

try {
  const input = fs.readFileSync(0, 'utf-8').trim();
  if (input) {
    console.log("=== STDIN RECEIVED ===");
    console.log(input);
  } else {
    console.log("No stdin input found. Type in the Stdin panel below!");
  }
} catch (e) {
  console.log("No input read:", e.message);
}
`
  },
  {
    id: 71,
    name: 'Python (3.x)',
    key: 'python',
    monaco: 'python',
    extension: 'py',
    badgeColor: '#3776ab',
    defaultCode: `# CodeHive Python Playground
def main():
    print("Hello from Python 3 in CodeHive! 🐝")
    fib = [0, 1]
    for _ in range(8):
        fib.append(fib[-1] + fib[-2])
    print(f"Fibonacci series: {fib}")

if __name__ == "__main__":
    main()
`,
    stdinTemplate: `# Reading standard input in Python
import sys

def main():
    lines = sys.stdin.read().splitlines()
    if lines:
        print(f"Read {len(lines)} line(s) from stdin:")
        for idx, line in enumerate(lines, 1):
            print(f"  [{idx}] {line}")
    else:
        print("Stdin was empty. Enter input in the Stdin drawer below.")

if __name__ == "__main__":
    main()
`
  },
  {
    id: 54,
    name: 'C++ (GCC)',
    key: 'cpp',
    monaco: 'cpp',
    extension: 'cpp',
    badgeColor: '#00599c',
    defaultCode: `// CodeHive C++ Playground
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello from C++ in CodeHive! 🐝" << std::endl;
    std::vector<int> numbers = {10, 20, 30, 40, 50};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    std::cout << "Sum of elements: " << sum << std::endl;
    return 0;
}
`,
    stdinTemplate: `// Reading standard input in C++
#include <iostream>
#include <string>

int main() {
    std::string line;
    std::cout << "Reading lines from stdin:" << std::endl;
    while (std::getline(std::cin, line)) {
        std::cout << "  > " << line << std::endl;
    }
    return 0;
}
`
  },
  {
    id: 62,
    name: 'Java (OpenJDK)',
    key: 'java',
    monaco: 'java',
    extension: 'java',
    badgeColor: '#ea2d2e',
    defaultCode: `// CodeHive Java Playground
// Note: Class name must be Main for Judge0
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java in CodeHive IDE! 🐝");
        int sum = 0;
        for (int i = 1; i <= 10; i++) {
            sum += i;
        }
        System.out.println("Sum of 1..10 = " + sum);
    }
}
`,
    stdinTemplate: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("Java Stdin Reader:");
        while (scanner.hasNextLine()) {
            System.out.println("  Echo: " + scanner.nextLine());
        }
        scanner.close();
    }
}
`
  },
  {
    id: 74,
    name: 'TypeScript',
    key: 'typescript',
    monaco: 'typescript',
    extension: 'ts',
    badgeColor: '#3178c6',
    defaultCode: `// CodeHive TypeScript Playground
interface Session {
  id: string;
  name: string;
  active: boolean;
}

const currentSession: Session = {
  id: "room-alpha",
  name: "Algorithms Pair Programming",
  active: true
};

console.log(\`Active session: \${currentSession.name} [ID: \${currentSession.id}] 🚀\`);
`,
    stdinTemplate: `import * as fs from 'fs';

const input = fs.readFileSync(0, 'utf-8');
console.log("TypeScript received stdin:", input ? input.trim() : "None");
`
  },
  {
    id: 60,
    name: 'Go',
    key: 'go',
    monaco: 'go',
    extension: 'go',
    badgeColor: '#00add8',
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello from Go in CodeHive! 🐝")
    scores := []int{98, 85, 92, 88}
    total := 0
    for _, score := range scores {
        total += score
    }
    fmt.Printf("Average score: %.1f\\n", float64(total)/float64(len(scores)))
}
`,
    stdinTemplate: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    fmt.Println("Reading Go stdin:")
    for scanner.Scan() {
        fmt.Println("  Line:", scanner.Text())
    }
}
`
  },
  {
    id: 73,
    name: 'Rust',
    key: 'rust',
    monaco: 'rust',
    extension: 'rs',
    badgeColor: '#dea584',
    defaultCode: `fn main() {
    println!("Hello from Rust in CodeHive! 🐝");
    let values = vec![10, 20, 30, 40, 50];
    let sum: i32 = values.iter().sum();
    println!("Calculated sum: {}", sum);
}
`,
    stdinTemplate: `use std::io::{self, BufRead};

fn main() {
    let stdin = io::stdin();
    println!("Reading Rust stdin:");
    for line in stdin.lock().lines() {
        if let Ok(l) = line {
            println!("  > {}", l);
        }
    }
}
`
  }
];

export const getLanguageById = (id) => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.id === Number(id)) || SUPPORTED_LANGUAGES[0];
};

export const getLanguageByKey = (key) => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.key === key.toLowerCase()) || SUPPORTED_LANGUAGES[0];
};
