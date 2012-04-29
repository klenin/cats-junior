#!perl
use strict;
use CGI qw(:standard);
use HTTP::Request::Common qw(POST);
use LWP::UserAgent;
use Data::Dumper;
my $q = new CGI;
my $ua = new LWP::UserAgent;
if ($ENV{MOD_PERL}) {
    require Apache2::Request;
    require Apache2::Upload;
    $q = Apache2::Request->new(Apache2::RequestUtil->request,
        POST_MAX => 10 * 1024 * 1024, # Actual limit is defined by Apache config.
        DISABLE_UPLOADS => 0);
    *param = sub { $q->param(@_) };
}
print "Content-type: text/html\n\n";

my $request = HTTP::Request->new('POST', 'http://'.$q->param('serv').$q->param('path').';sid='.$q->param('sid').';cid='.$q->param('cid'));
my $boundary = 'X';
my @rand = ('a'..'z', 'A'..'Z');
for (0..14) {$boundary .= $rand[rand(@rand)];}
$request->header('Content-Type' => 'multipart/form-data; boundary='.$boundary.';');
$request->header('Referer' => $q->param('serv'));
$request->header('Host' => $q->param('serv'));
$request->header('Connection' => 'Close');
$request->protocol('HTTP/1.0'); 

my $fields = [['search', ''], ['rows', '20'], ['problem_id', $q->param('problem_id')], ["de_id", $q->param('de_id')], ["submit", "Send"]];
for(@$fields){
	my $field = HTTP::Message->new(
		[
			'Content-Disposition'   => 'form-data; name="'.$_->[0].'"',
		]);
	$field->add_content_utf8($_->[1]); 
	$request->add_part($field);
}

my $f = HTTP::Message->new([
      'Content-Disposition' => 'form-data; name="source"; filename="output.txt"',
	  'Content-Type' => 'text/plain',
      'Content-Length' => length($q->param('source'))]);
$f->add_content($q->param('source'));
$request->add_part($f);

my $response = $ua->request($request);
if ($response->is_success) {
    print $response->content
} else {
    die $response->status_line
}