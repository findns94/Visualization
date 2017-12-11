#include<stdio.h>

int main(){
	int localVar = 8;

	localVar=localVar<<5;
	printf("%d\n", localVar);
	localVar=localVar>>2;
	printf("%d\n", localVar);
	localVar=localVar<<30;
	printf("%d\n", localVar);

	return 0;
}
