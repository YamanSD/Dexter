#include<stdio.h>

int main() {
    int a, b, c = 0;

    printf("Enter 2 integers: ");
    scanf("%d %d", &a, &b);

    for (int j = a; j <= b; j++) {
        c += j;
    }

    printf("Sum of values equals to: %d\n", c);
}
