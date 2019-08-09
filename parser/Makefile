CC = gcc
CFLAGS = -g -Wall -pedantic -std=c11
inc = -I /include/

all: list parser

list: src/LinkedListAPI.c
	$(CC) $(CFLAGS) -I include -fpic -c src/LinkedListAPI.c -o bin/list.o
	$(CC) -shared bin/list.o -o bin/liblist.so

parser: src/CalendarParser.c
	$(CC) $(CFLAGS) -I include -fpic -c src/CalendarParser.c -o bin/cal.o
	$(CC) -shared bin/cal.o bin/list.o -o ../libcal.so

clean:
	rm -rf bin/*.o bin/test bin/*.so
